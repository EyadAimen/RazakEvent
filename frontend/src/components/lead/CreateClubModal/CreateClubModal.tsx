"use client";

import { useState, useRef } from "react";
import { X, Upload, Building2, Users, Info } from "lucide-react";
import { createClubRequest } from "@/components/lead/utils/services/create-club.service";
import { ApiError } from "@/lib/api";
import styles from "./CreateClubModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  clubName?: string;
  category?: string;
  description?: string;
  supportingLetter?: string;
}

export default function CreateClubModal({ isOpen, onClose, onSuccess }: Props) {
  const [clubType, setClubType] = useState<"club" | "community">("club");
  const [clubName, setClubName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supportingLetter, setSupportingLetter] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!clubName.trim()) {
      next.clubName = "Club name is required";
    } else if (clubName.trim().length < 3) {
      next.clubName = "Club name must be at least 3 characters";
    } else if (clubName.trim().length > 100) {
      next.clubName = "Club name must be at most 100 characters";
    }

    if (!category.trim()) {
      next.category = "Category is required";
    } else if (category.trim().length < 2) {
      next.category = "Category must be at least 2 characters";
    } else if (category.trim().length > 50) {
      next.category = "Category must be at most 50 characters";
    }

    if (!description.trim()) {
      next.description = "Description is required";
    } else if (description.trim().length < 20) {
      next.description = "Description must be at least 20 characters";
    } else if (description.trim().length > 500) {
      next.description = "Description must be at most 500 characters";
    }

    if (supportingLetter) {
      if (supportingLetter.type !== "application/pdf") {
        next.supportingLetter = "Only PDF files are accepted";
      } else if (supportingLetter.size > 10 * 1024 * 1024) {
        next.supportingLetter = "File must be under 10 MB";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setClubType("club");
    setClubName("");
    setCategory("");
    setDescription("");
    setSupportingLetter(null);
    setErrors({});
    setApiError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createClubRequest({ clubName, clubType, category, description, supportingLetter });
      resetForm();
      onSuccess();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSupportingLetter(file);
    setErrors(prev => ({ ...prev, supportingLetter: undefined }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSupportingLetter(file);
      setErrors(prev => ({ ...prev, supportingLetter: undefined }));
    }
  };

  const typeLabel = clubType === "club" ? "CLUB" : "COMMUNITY";

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div>
            <p className={styles.headerLabel}>NEW REQUEST</p>
            <h2 className={styles.headerTitle}>Create Club / Community</h2>
            <p className={styles.headerSubtitle}>Your proposal will be reviewed by an admin.</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* ── Body / Form ───────────────────────────────────────────── */}
        <form className={styles.body} onSubmit={handleSubmit} noValidate>

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          {/* Type toggle */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              TYPE <span className={styles.required}>*</span>
            </label>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${clubType === "club" ? styles.typeBtnActive : ""}`}
                onClick={() => setClubType("club")}
              >
                <Building2 size={13} /> Club
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${clubType === "community" ? styles.typeBtnActive : ""}`}
                onClick={() => setClubType("community")}
              >
                <Users size={13} /> Community
              </button>
            </div>
          </div>

          {/* Club / Community name */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              {typeLabel} NAME <span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${errors.clubName ? styles.inputError : ""}`}
              type="text"
              placeholder="e.g. Photography Club"
              value={clubName}
              maxLength={101}
              onChange={e => {
                setClubName(e.target.value);
                setErrors(p => ({ ...p, clubName: undefined }));
              }}
            />
            {errors.clubName && <p className={styles.fieldError}>{errors.clubName}</p>}
          </div>

          {/* Category */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              CATEGORY <span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${errors.category ? styles.inputError : ""}`}
              type="text"
              placeholder="e.g. Technology, Sports, Arts…"
              value={category}
              maxLength={51}
              onChange={e => {
                setCategory(e.target.value);
                setErrors(p => ({ ...p, category: undefined }));
              }}
            />
            {errors.category && <p className={styles.fieldError}>{errors.category}</p>}
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              DESCRIPTION <span className={styles.required}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
              placeholder="Describe the purpose, goals, and planned activities…"
              value={description}
              rows={4}
              maxLength={501}
              onChange={e => {
                setDescription(e.target.value);
                setErrors(p => ({ ...p, description: undefined }));
              }}
            />
            <span className={styles.charCount}>{description.length} / 500</span>
            {errors.description && <p className={styles.fieldError}>{errors.description}</p>}
          </div>

          {/* Supporting letter */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              SUPPORTING LETTER <span className={styles.optional}>(OPTIONAL)</span>
            </label>
            <div
              className={`${styles.uploadZone} ${errors.supportingLetter ? styles.uploadZoneError : ""}`}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              {supportingLetter ? (
                <div className={styles.uploadedFile}>
                  <span className={styles.fileName}>{supportingLetter.name}</span>
                  <button
                    type="button"
                    className={styles.removeFile}
                    onClick={e => {
                      e.stopPropagation();
                      setSupportingLetter(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={20} className={styles.uploadIcon} />
                  <span className={styles.uploadText}>Click to upload or drag &amp; drop</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className={styles.hiddenInput}
              onChange={handleFileChange}
            />
            {errors.supportingLetter && <p className={styles.fieldError}>{errors.supportingLetter}</p>}
          </div>

          {/* Info note */}
          <div className={styles.infoNote}>
            <Info size={14} className={styles.infoIcon} />
            <p>
              Your club creation request will be sent to an admin for approval. You will be notified
              via your dashboard once a decision has been made.
            </p>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit for Approval"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
