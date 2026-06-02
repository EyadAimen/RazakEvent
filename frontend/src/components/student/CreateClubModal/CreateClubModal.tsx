"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";
import styles from "./CreateClubModal.module.css";

type Props = {
  onClose: () => void;
  onSubmit: (data: {
    clubName: string;
    clubType: "club" | "community";
    description: string;
    category: string;
    supportingLetter?: File | null;
  }) => void;
  submitting: boolean;
};

export default function CreateClubModal({ onClose, onSubmit, submitting }: Props) {
  const [clubName, setClubName] = useState("");
  const [clubType, setClubType] = useState<"club" | "community">("club");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [supportingLetter, setSupportingLetter] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!clubName.trim()) e.clubName = "Club name is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (!category.trim()) e.category = "Category is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({ clubName: clubName.trim(), clubType, description: description.trim(), category: category.trim(), supportingLetter });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <h2 className={styles.title}>Create New Club</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className={styles.note}>
          Your request will be reviewed by the admin before the club is created.
        </p>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Club / Community Name</label>
            <input
              className={`${styles.input} ${errors.clubName ? styles.inputError : ""}`}
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g. Photography Society"
              disabled={submitting}
            />
            {errors.clubName && <p className={styles.errorText}>{errors.clubName}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <select
              className={styles.select}
              value={clubType}
              onChange={(e) => setClubType(e.target.value as "club" | "community")}
              disabled={submitting}
            >
              <option value="club">Club</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <input
              className={`${styles.input} ${errors.category ? styles.inputError : ""}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Technology, Arts & Culture, Sports"
              disabled={submitting}
            />
            {errors.category && <p className={styles.errorText}>{errors.category}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose and activities of your club…"
              rows={3}
              disabled={submitting}
            />
            {errors.description && <p className={styles.errorText}>{errors.description}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Supporting Letter <span className={styles.optional}>(optional)</span></label>
            <label className={`${styles.fileLabel} ${submitting ? styles.fileLabelDisabled : ""}`}>
              <Upload size={14} />
              {supportingLetter ? supportingLetter.name : "Upload PDF or document"}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className={styles.fileInput}
                onChange={(e) => setSupportingLetter(e.target.files?.[0] ?? null)}
                disabled={submitting}
              />
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
