import { FormEvent, useEffect, useState } from "react";
import { updateCompanyProfile } from "../store/slices/portalSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { CompanyProfile } from "../types";

type SaveStatus = "idle" | "saving" | "error";

const emptyProfile: CompanyProfile = {
  companyName: "",
  companyType: "",
  industry: "",
  address: "",
  city: "",
  country: "",
  website: "",
  about: "",
  teamSize: "",
};

export function CompanyProfilePage() {
  const dispatch = useAppDispatch();
  const companyProfile = useAppSelector(
    (state: any) => state.portal.companyProfile,
  ) as CompanyProfile | null;
  const [form, setForm] = useState<CompanyProfile>(
    companyProfile ?? emptyProfile,
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (companyProfile) {
      setForm(companyProfile);
    }
  }, [companyProfile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveStatus("saving");
    try {
      await dispatch(updateCompanyProfile(form)).unwrap();
      setSaveStatus("idle");
      setProfileSaved(true);
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <h2>Company Identity</h2>
        <p>
          Make your employer brand look strong with complete profile details and
          context.
        </p>
        <div className="hero-media-row">
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600"
              alt="Office space"
            />
            <span>Workplace</span>
          </div>
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600"
              alt="Team collaboration"
            />
            <span>Culture</span>
          </div>
          <div className="media-tile">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=600"
              alt="Business growth"
            />
            <span>Growth</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Company Profile</h2>
          <span className="pill">Brand Settings</span>
        </div>
        <p className="section-subtitle">
          Update company information including address, company type, and
          branding details.
        </p>

        {profileSaved ? (
          <div className="profile-saved-state">
            <div className="profile-saved-icon">✅</div>
            <h3 className="profile-saved-title">
              Company Profile Saved Successfully
            </h3>
            <p className="profile-saved-subtitle">
              Your company profile has been saved.
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setProfileSaved(false)}
            >
              Edit Company Profile
            </button>
          </div>
        ) : (
          <form className="pretty-form form-grid" onSubmit={handleSubmit}>
            <p className="form-section-title">Core Details</p>
            <div className="form-two-col">
              <div className="field-wrap">
                <label htmlFor="company-name">Company Name</label>
                <input
                  id="company-name"
                  value={form.companyName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field-wrap">
                <label htmlFor="company-type">Company Type</label>
                <input
                  id="company-type"
                  value={form.companyType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      companyType: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="form-two-col">
              <div className="field-wrap">
                <label htmlFor="industry">Industry</label>
                <input
                  id="industry"
                  value={form.industry}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      industry: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field-wrap">
                <label htmlFor="team-size">Team Size</label>
                <input
                  id="team-size"
                  value={form.teamSize}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      teamSize: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <p className="form-section-title">Location & Links</p>
            <div className="form-two-col">
              <div className="field-wrap">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field-wrap">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="form-two-col">
              <div className="field-wrap">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  value={form.country}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field-wrap">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  value={form.website}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="field-wrap">
              <label htmlFor="about">About Company</label>
              <textarea
                id="about"
                value={form.about}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    about: event.target.value,
                  }))
                }
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              className="primary-btn"
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? "Saving..." : "Save Company Profile"}
            </button>
            {saveStatus === "error" && (
              <p className="save-feedback save-feedback--error">
                ❌ Failed to save company profile. Please try again.
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
