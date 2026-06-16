"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/button/button";
import styles from "./ApplyForm.module.css";
import Alert from "@/components/shared/alertComponent/alert";
import { applyForVolunteering } from "./utils/services/volunteer.service";
import { EventData } from "./utils/interfaces/volunteer.interface";

type Props = {
  eventData: EventData;
};

export default function ApplyForm({ eventData }: Props) {
  const router = useRouter();
  
  // States
  const [selectedRoleId, setSelectedRoleId] = useState<string | "">(
    eventData.roles.length === 1 ? eventData.roles[0].roleId : ""
  );
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived
  const selectedRole = selectedRoleId ? eventData.roles.find(r => r.roleId === selectedRoleId) : undefined;
  const isSubmitDisabled = !selectedRoleId || !reason.trim() || !acknowledged || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    setError(null);

    try {
      await applyForVolunteering(selectedRoleId, reason.trim());

      // Redirect to applications page on success
      router.push("/volunteering");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while submitting your application.");
      setLoading(false);
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h1 className={styles.title}>Volunteer Application</h1>
        <p className={styles.subtitle}>Apply to volunteer for this event.</p>
      </div>

      <div className={styles.eventDetailsBox}>
        <div>
          <h3 className={styles.eventName}>{eventData.eventName}</h3>
          <p className={styles.eventMeta}>
            {eventData.clubName} • {new Date(eventData.eventDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className={styles.roleSeparator} />

        {eventData.roles.length > 1 ? (
          <div className={styles.roleSelectGroup}>
            <label className={styles.roleLabel}>Select a Role</label>
            <select
              className={styles.roleSelect}
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              <option value="" disabled>Select a role...</option>
              {eventData.roles.map(role => (
                <option 
                  key={role.roleId} 
                  value={role.roleId} 
                  disabled={role.slotsFilled >= role.slotsAvailable}
                >
                  {role.roleName} {role.slotsFilled >= role.slotsAvailable ? "(Full)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {selectedRole && (
          <div>
            <h4 className={styles.roleLabel}>Role Description</h4>
            <p className={styles.roleDescription}>
              {selectedRole.description || "No description provided."}
            </p>
          </div>
        )}
      </div>

      <div className={styles.reasonGroup}>
        <label className={styles.label}>Why should we select you?</label>
        <p className={styles.sublabel}>
          Tell the club lead about your skills, enthusiasm, and why you're a great fit.
        </p>
        <textarea
          className={styles.textArea}
          placeholder="I am very passionate about photography and have experience with..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>

      <div className={styles.checkboxGroup}>
        <div className={styles.checkboxContainer}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            required
            id="acknowledge-checkbox"
          />
          <label htmlFor="acknowledge-checkbox" className={styles.checkboxText}>
            <span className={styles.checkboxTitle}>I acknowledge my commitment</span>
            <span className={styles.checkboxSubtitle}>
              By applying, I confirm my availability for the event date and time. I understand that failure to attend without prior notice may affect my future volunteering opportunities with KTR.
            </span>
          </label>
        </div>
      </div>

      <Alert 
        isOpen={!!error} 
        onClose={() => setError(null)} 
        variant="error" 
        message={error || "An error occurred"} 
      />

      <div className={styles.actions}>
        <button 
          type="button" 
          className={styles.cancelButton}
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isSubmitDisabled}
        >
          {loading ? "Processing..." : "Submit Application"}
        </Button>
      </div>
    </form>
  );
}
