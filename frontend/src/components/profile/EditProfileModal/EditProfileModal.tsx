"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import InputField from "@/components/shared/input-field/input-field";
import Button from "@/components/shared/button/button";
import styles from "./EditProfileModal.module.css";

type Props = {
  isOpen: boolean;
  currentName: string;
  saving: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};

export default function EditProfileModal({
  isOpen,
  currentName,
  saving,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(currentName ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(currentName ?? "");
      setError("");
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    setError("");
    await onSave(trimmed);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Profile</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <InputField
            label="Full Name"
            type="text"
            value={name}
            placeholder="Enter your full name"
            errorMessage={error}
            onChange={setName}
          />
        </div>

        <div className={styles.modalFooter}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
