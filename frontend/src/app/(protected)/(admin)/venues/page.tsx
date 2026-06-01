"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  fetchAdminVenues,
  fetchVenueBookedDates,
  createAdminVenue,
  updateAdminVenue,
  deleteAdminVenue,
} from "./utils/services/venues.service";
import type {
  AdminVenue,
  VenueBookedDate,
  VenueFormData,
  VenueFormErrors,
} from "./utils/interfaces/venues.interface";
import styles from "./page.module.css";

type ModalMode = "add" | "edit" | "delete" | "booked";

const EMPTY_FORM: VenueFormData = { name: "", location: "" };

export default function AdminVenuesPage() {
  const [venues,       setVenues]       = useState<AdminVenue[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [apiError,     setApiError]     = useState<string | null>(null);

  // Modal state
  const [modal,        setModal]        = useState<ModalMode | null>(null);
  const [selected,     setSelected]     = useState<AdminVenue | null>(null);
  const [form,         setForm]         = useState<VenueFormData>(EMPTY_FORM);
  const [formErrors,   setFormErrors]   = useState<VenueFormErrors>({});
  const [saving,       setSaving]       = useState(false);
  const [modalError,   setModalError]   = useState<string | null>(null);

  // Booked dates drawer
  const [bookedDates,  setBookedDates]  = useState<VenueBookedDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  useEffect(() => { loadVenues(); }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      setVenues(await fetchAdminVenues());
    } catch {
      setApiError("Failed to load venues.");
    } finally {
      setLoading(false);
    }
  };

  // ── Open helpers ─────────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalError(null);
    setSelected(null);
    setModal("add");
  };

  const openEdit = (venue: AdminVenue) => {
    setForm({ name: venue.name, location: venue.location ?? "" });
    setFormErrors({});
    setModalError(null);
    setSelected(venue);
    setModal("edit");
  };

  const openDelete = (venue: AdminVenue) => {
    setModalError(null);
    setSelected(venue);
    setModal("delete");
  };

  const openBooked = async (venue: AdminVenue) => {
    setSelected(venue);
    setBookedDates([]);
    setModal("booked");
    setLoadingDates(true);
    try {
      setBookedDates(await fetchVenueBookedDates(venue.id));
    } catch {
      /* leave empty */
    } finally {
      setLoadingDates(false);
    }
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  // ── Validate form ────────────────────────────────────────────────────────────

  const validateForm = (): VenueFormErrors => {
    const errs: VenueFormErrors = {};
    if (!form.name.trim()) errs.name = "Venue name is required.";
    else if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    return errs;
  };

  // ── Save (add / edit) ────────────────────────────────────────────────────────

  const handleSave = async () => {
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setModalError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        ...(form.location.trim() && { location: form.location.trim() }),
      };

      if (modal === "add") {
        const created = await createAdminVenue(payload);
        setVenues(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (modal === "edit" && selected) {
        const updated = await updateAdminVenue(selected.id, payload);
        setVenues(prev =>
          prev.map(v => (v.id === selected.id ? updated : v))
              .sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      closeModal();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!selected) return;
    setModalError(null);
    setSaving(true);
    try {
      await deleteAdminVenue(selected.id);
      setVenues(prev => prev.filter(v => v.id !== selected.id));
      closeModal();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to delete venue.");
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-MY", {
      weekday: "short", day: "numeric", month: "short",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const filtered = venues.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.location ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Loading venues…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.headerLabel}>Admin Panel</p>
            <h1 className={styles.headerTitle}>Venue Management</h1>
            <p className={styles.headerSub}>Create, edit, and remove event venues</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.statsRow}>
              <div className={styles.statBadge}>
                <span className={styles.statValue}>{venues.length}</span>
                <span className={styles.statLabel}>Total Venues</span>
              </div>
            </div>
            <button className={styles.ctaBtn} onClick={openAdd}>
              <Plus size={16} /> Add Venue
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className={styles.content}>
        {apiError && <p className={styles.pageError}>{apiError}</p>}

        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <div className={styles.searchWrap}>
              <MapPin size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search venues…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Venue Name</th>
                <th>Location</th>
                <th>Bookings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    {search ? "No venues match your search." : "No venues yet. Add one to get started."}
                  </td>
                </tr>
              ) : (
                filtered.map(venue => (
                  <tr key={venue.id}>
                    <td>
                      <p className={styles.venueName}>{venue.name}</p>
                    </td>
                    <td className={styles.locationCell}>
                      {venue.location ?? <span className={styles.noLocation}>—</span>}
                    </td>
                    <td>
                      <button
                        className={styles.bookingsBtn}
                        onClick={() => openBooked(venue)}
                      >
                        <Calendar size={13} /> View Schedule
                      </button>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => openEdit(venue)}>
                          <Pencil size={14} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => openDelete(venue)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      {(modal === "add" || modal === "edit") && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalLabel}>Admin Panel</p>
                <h2 className={styles.modalTitle}>
                  {modal === "add" ? "Add New Venue" : `Edit "${selected?.name}"`}
                </h2>
              </div>
              <button className={styles.modalClose} onClick={closeModal}><X size={16} /></button>
            </div>

            <div className={styles.modalBody}>
              {modalError && <p className={styles.modalError}>{modalError}</p>}

              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Venue Name <span className={styles.req}>*</span>
                </label>
                <input
                  className={`${styles.input} ${formErrors.name ? styles.inputErr : ""}`}
                  type="text"
                  placeholder="e.g. Dewan Tun Hussein Onn"
                  value={form.name}
                  onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: undefined })); }}
                />
                {formErrors.name && <p className={styles.fieldError}>{formErrors.name}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Location <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Block A, Level 2"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={14} className={styles.spinnerInline} />}
                {modal === "add" ? "Add Venue" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────── */}
      {modal === "delete" && selected && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={`${styles.modal} ${styles.confirmModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <AlertTriangle size={36} className={styles.confirmIcon} />
              <h2 className={styles.confirmTitle}>Delete Venue?</h2>
              <p className={styles.confirmSub}>
                Are you sure you want to delete <strong>{selected.name}</strong>?
                This cannot be undone and may affect existing proposals that reference this venue.
              </p>
            </div>

            {modalError && <p className={styles.modalErrorCenter}>{modalError}</p>}

            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className={styles.deleteConfirmBtn} onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 size={14} className={styles.spinnerInline} />}
                Delete Venue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booked Dates Modal ───────────────────────────────────── */}
      {modal === "booked" && selected && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={`${styles.modal} ${styles.bookedModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalLabel}>Venue Schedule</p>
                <h2 className={styles.modalTitle}>{selected.name}</h2>
                {selected.location && <p className={styles.modalSub}>{selected.location}</p>}
              </div>
              <button className={styles.modalClose} onClick={closeModal}><X size={16} /></button>
            </div>

            <div className={styles.modalBody}>
              {loadingDates ? (
                <div className={styles.datesLoading}>
                  <Loader2 size={20} className={styles.spinner} />
                  <p>Loading schedule…</p>
                </div>
              ) : bookedDates.length === 0 ? (
                <div className={styles.datesEmpty}>
                  <Calendar size={32} />
                  <p>No upcoming events booked at this venue.</p>
                </div>
              ) : (
                <ul className={styles.datesList}>
                  {bookedDates.map(d => (
                    <li key={d.eventId} className={styles.datesItem}>
                      <div className={styles.datesItemLeft}>
                        <span className={styles.datesDate}>{formatDate(d.eventDate)}</span>
                        <span className={styles.datesName}>{d.name}</span>
                      </div>
                      <span className={`${styles.statusChip} ${styles[`status_${d.status}`]}`}>
                        {d.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
