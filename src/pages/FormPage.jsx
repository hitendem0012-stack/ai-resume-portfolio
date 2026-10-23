import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { portfolioFromFormValues } from "../services/schema";
import { loadPortfolio, savePortfolio } from "../services/storage";
import { IMAGE_ACCEPT, ImageValidationError, processProfileImage } from "../utils/image";

function emptyProject() {
  return { title: "", description: "", url: "", technologies: "" };
}

function getInitialForm() {
  const saved = loadPortfolio().data;
  return {
    name: saved.profile.name,
    email: saved.profile.email,
    image: saved.profile.image,
    about: saved.profile.about,
    skills: saved.skills.join(", "),
    education: saved.education,
    experience: saved.experience,
    linkedin: saved.social.linkedin,
    github: saved.social.github,
    instagram: saved.social.instagram,
    behance: saved.social.behance,
    projects: saved.projects.length
      ? saved.projects.map((project) => ({
          title: project.title,
          description: project.description,
          url: project.url || "",
          technologies: project.technologies.join(", "),
        }))
      : [emptyProject(), emptyProject()],
  };
}

export default function FormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(getInitialForm);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const projectCount = form.projects.length;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleProjectChange = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      projects: previous.projects.map((project, projectIndex) =>
        projectIndex === index ? { ...project, [field]: value } : project
      ),
    }));
  };

  const addProject = () => {
    if (form.projects.length >= 6) return;
    setForm((previous) => ({ ...previous, projects: [...previous.projects, emptyProject()] }));
  };

  const removeProject = (index) => {
    setForm((previous) => ({
      ...previous,
      projects: previous.projects.filter((_, projectIndex) => projectIndex !== index),
    }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageError("");
    setImageBusy(true);
    try {
      const { dataUrl } = await processProfileImage(file);
      setForm((previous) => ({ ...previous, image: dataUrl }));
    } catch (error) {
      setImageError(
        error instanceof ImageValidationError
          ? error.message
          : "The image could not be processed. Please choose another file."
      );
    } finally {
      setImageBusy(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.name.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    const socialFields = ["linkedin", "github", "instagram", "behance"];
    for (const field of socialFields) {
      const value = form[field].trim();
      if (!value) continue;
      try {
        const url = new URL(value);
        if (!(["http:", "https:"].includes(url.protocol))) throw new Error("Invalid protocol");
      } catch {
        setSubmitError(`Enter a complete URL beginning with https:// for ${field}.`);
        return;
      }
    }

    const result = savePortfolio(portfolioFromFormValues(form));
    if (!result.ok) {
      setSubmitError(result.error.message);
      return;
    }
    navigate("/portfolio");
  };

  return (
    <main className="form-page">
      <div className="form-wrapper">
        <section className="hero" aria-labelledby="builder-heading">
          <p className="eyebrow">PERSONAL BRANDING TOOLKIT</p>
          <h1 id="builder-heading">AI Resume<br />Builder</h1>
          <p className="hero-copy">Build a portfolio from your real experience, skills and projects.</p>
          <p className="hero-support">Complete the form, generate your portfolio, then open each desktop icon to explore your profile.</p>
          <div className="feature-list" aria-label="Included sections">
            <span><b>01</b> Profile and education</span>
            <span><b>02</b> Skills and experience</span>
            <span><b>03</b> Projects and social links</span>
          </div>
        </section>

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-heading">
            <div>
              <p className="eyebrow">YOUR DETAILS</p>
              <h2>Create your portfolio</h2>
            </div>
            <span className="step-count">01 / 01</span>
          </div>

          <label className={`upload-box${form.image ? " has-image" : ""}`}>
            {form.image ? (
              <>
                <img src={form.image} alt="Profile image preview" />
                <span className="upload-copy"><strong>Profile image selected</strong><small>Click to replace image</small></span>
              </>
            ) : (
              <>
                <span className="upload-symbol" aria-hidden="true">↑</span>
                <span className="upload-copy"><strong>{imageBusy ? "Processing image…" : "Upload a profile image"}</strong><small>JPEG, PNG or WebP · up to 10 MB</small></span>
              </>
            )}
            <input type="file" name="image" accept={IMAGE_ACCEPT} onChange={handleImageChange} disabled={imageBusy} />
          </label>
          {form.image && (
            <button className="text-button remove-image" type="button" onClick={() => setForm((previous) => ({ ...previous, image: "" }))}>
              Remove profile image
            </button>
          )}
          {imageError && <p className="form-error" role="alert">{imageError}</p>}

          <div className="section-label">Profile</div>
          <div className="grid-2">
            <label className="field"><span>Full name *</span><input name="name" value={form.name} placeholder="e.g. Hiten Dem" autoComplete="name" onChange={handleChange} required /></label>
            <label className="field"><span>Email address *</span><input type="email" name="email" value={form.email} placeholder="you@example.com" autoComplete="email" onChange={handleChange} required /></label>
          </div>
          <label className="field"><span>About me</span><textarea name="about" value={form.about} placeholder="A short introduction about your interests, strengths and goals…" rows={3} onChange={handleChange} /></label>

          <div className="section-label">Skills and background</div>
          <label className="field"><span>Skills</span><input name="skills" value={form.skills} placeholder="JavaScript, React, SQL, teamwork" onChange={handleChange} /></label>
          <label className="field"><span>Education</span><input name="education" value={form.education} placeholder="Degree, university, graduation year" onChange={handleChange} /></label>
          <label className="field"><span>Experience</span><textarea name="experience" value={form.experience} placeholder="Internships, volunteering, responsibilities or relevant work…" rows={3} onChange={handleChange} /></label>

          <div className="section-heading-row">
            <div className="section-label">Projects</div>
            <span className="muted-count">{projectCount} of 6</span>
          </div>
          {form.projects.map((project, index) => (
            <section className="project-editor" key={`project-${index}`} aria-label={`Project ${index + 1}`}>
              <div className="project-editor-heading">
                <strong>Project {index + 1}</strong>
                {form.projects.length > 1 && <button className="text-button" type="button" onClick={() => removeProject(index)}>Remove</button>}
              </div>
              <label className="field"><span>Project title</span><input value={project.title} placeholder="e.g. AI Resume Portfolio" onChange={(event) => handleProjectChange(index, "title", event.target.value)} /></label>
              <label className="field"><span>Description</span><textarea value={project.description} placeholder="What does it do? What did you build?" rows={3} onChange={(event) => handleProjectChange(index, "description", event.target.value)} /></label>
              <label className="field"><span>Project URL (optional)</span><input type="url" value={project.url} placeholder="https://github.com/you/project" onChange={(event) => handleProjectChange(index, "url", event.target.value)} /></label>
              <label className="field"><span>Technologies</span><input value={project.technologies} placeholder="React, Vite, CSS" onChange={(event) => handleProjectChange(index, "technologies", event.target.value)} /></label>
            </section>
          ))}
          <button className="secondary-button" type="button" onClick={addProject} disabled={form.projects.length >= 6}>+ Add another project</button>

          <div className="section-label">Social links</div>
          <div className="grid-2">
            <label className="field"><span>LinkedIn</span><input type="url" name="linkedin" value={form.linkedin} placeholder="https://linkedin.com/in/…" onChange={handleChange} /></label>
            <label className="field"><span>GitHub</span><input type="url" name="github" value={form.github} placeholder="https://github.com/…" onChange={handleChange} /></label>
          </div>
          <div className="grid-2">
            <label className="field"><span>Instagram</span><input type="url" name="instagram" value={form.instagram} placeholder="https://instagram.com/…" onChange={handleChange} /></label>
            <label className="field"><span>Behance</span><input type="url" name="behance" value={form.behance} placeholder="https://behance.net/…" onChange={handleChange} /></label>
          </div>

          {submitError && <p className="form-error" role="alert">{submitError}</p>}
          <button className="primary-button" type="submit" disabled={imageBusy}>{imageBusy ? "Preparing image…" : "Generate portfolio"}<span aria-hidden="true">↗</span></button>
          <p className="privacy-note">Your details are saved in this browser for this demo. No account is required.</p>
        </form>
      </div>
    </main>
  );
}
