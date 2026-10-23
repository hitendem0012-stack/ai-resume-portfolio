import { useState } from "react";
import Window from "../components/Window";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { buildScript } from "../services/ai/adapters/mock";

const SECTION_NAMES = ["education", "skills", "resume", "projects", "experience", "contact"];
const SOCIALS = [
  { key: "github", label: "GitHub", icon: "/icons/github.png" },
  { key: "linkedin", label: "LinkedIn", icon: "/icons/linkedin.png" },
  { key: "instagram", label: "Instagram", icon: "/icons/instagram.png" },
  { key: "behance", label: "Behance", icon: "/icons/behance.png" },
];

export default function PortfolioPage() {
  const { data, error: loadError } = usePortfolioData();
  const [windows, setWindows] = useState([]);
  const [minimized, setMinimized] = useState([]);
  const [script, setScript] = useState("");
  const [scriptError, setScriptError] = useState("");

  const openWindow = (name) => {
    setMinimized((previous) => previous.filter((item) => item !== name));
    setWindows((previous) => {
      const existing = previous.find((window) => window.name === name);
      if (existing) return previous.map((window) => window.name === name ? { ...window, z: Date.now() } : window);
      return [...previous, { name, z: Date.now() }];
    });
  };

  const closeWindow = (name) => {
    setWindows((previous) => previous.filter((window) => window.name !== name));
    setMinimized((previous) => previous.filter((item) => item !== name));
  };

  const minimizeWindow = (name) => {
    setWindows((previous) => previous.filter((window) => window.name !== name));
    setMinimized((previous) => previous.includes(name) ? previous : [...previous, name]);
  };

  const bringToFront = (name) => {
    setWindows((previous) => previous.map((window) => window.name === name ? { ...window, z: Date.now() } : window));
  };

  const generatePresentationScript = () => {
    setScriptError("");
    try {
      setScript(buildScript(data).text);
    } catch (error) {
      setScriptError(error instanceof Error ? error.message : "Add some portfolio details first.");
    }
  };

  const { profile, social, projects, skills, education, experience } = data;
  const activeSocials = SOCIALS.filter((item) => social[item.key]);

  return (
    <main className="portfolio">
      <aside className="sidebar">
        {profile.image ? (
          <img src={profile.image} className="profile-img" alt={`Portrait of ${profile.name || "portfolio owner"}`} />
        ) : (
          <div className="profile-placeholder" aria-hidden="true">{profile.name ? profile.name.trim().charAt(0).toUpperCase() : "P"}</div>
        )}
        <h2>{profile.name || "Your Name"}</h2>
        <p className="sidebar-email">{profile.email || "email@example.com"}</p>
        {profile.about && <p className="sidebar-about">{profile.about}</p>}
        <button className="edit-profile-button" type="button" onClick={() => { window.location.href = "/"; }}>Edit profile</button>
      </aside>

      <section className="main-area" aria-label="Interactive portfolio desktop">
        {loadError && <p className="storage-notice" role="alert">{loadError.message}</p>}
        <img src="/bg.jpg" className="bg-image" alt="" draggable="false" />

        <div className="floating-icons">
          {SECTION_NAMES.map((name, index) => (
            <button key={name} type="button" className={`item i${index + 1}`} onClick={() => openWindow(name)} aria-label={`Open ${name} window`}>
              <img src={`/images/${name}.png`} alt="" draggable="false" />
              <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </button>
          ))}
        </div>

        {windows.map((window) => (
          <Window
            key={window.name}
            title={window.name}
            zIndex={window.z}
            onClose={() => closeWindow(window.name)}
            onMinimize={() => minimizeWindow(window.name)}
            onFocus={() => bringToFront(window.name)}
          >
            {window.name === "education" && (
              <div className="window-section"><h3>Education</h3><p>{education || "Add your education details in the profile builder."}</p></div>
            )}

            {window.name === "skills" && (
              <div className="window-section"><h3>Skills</h3>{skills.length ? <div className="skill-list">{skills.map((skill, index) => <span className="skill-chip" key={`${skill}-${index}`}>{skill}</span>)}</div> : <p>Add your skills in the profile builder.</p>}</div>
            )}

            {window.name === "projects" && (
              <div className="window-section"><h3>Projects</h3>{projects.length ? projects.map((project, index) => (
                <article className="project-card" key={`${project.title}-${index}`}>
                  <h4>{project.title || `Project ${index + 1}`}</h4>
                  {project.description && <p>{project.description}</p>}
                  {project.technologies.length > 0 && <p className="project-tech"><strong>Technologies:</strong> {project.technologies.join(", ")}</p>}
                  {project.url && <a className="project-link" href={project.url} target="_blank" rel="noopener noreferrer">View project ↗</a>}
                </article>
              )) : <p>No projects added yet.</p>}</div>
            )}

            {window.name === "experience" && (
              <div className="window-section"><h3>Experience</h3><p className="preserve-lines">{experience || "Add internships, work, volunteering or relevant experience in the profile builder."}</p></div>
            )}

            {window.name === "contact" && (
              <div className="window-section"><h3>Get in touch</h3><p>{profile.email || "Add your email in the profile builder."}</p>{activeSocials.length > 0 && <div className="contact-links">{activeSocials.map((item) => <a key={item.key} href={social[item.key]} target="_blank" rel="noopener noreferrer">Visit {item.label}</a>)}</div>}</div>
            )}

            {window.name === "resume" && (
              <div className="window-section resume-content">
                <p className="resume-kicker">PORTFOLIO SUMMARY</p>
                <h3>{profile.name || "Your Name"}</h3>
                {profile.about && <p>{profile.about}</p>}
                {profile.email && <p><strong>Email:</strong> {profile.email}</p>}
                {education && <p><strong>Education:</strong> {education}</p>}
                {skills.length > 0 && <p><strong>Skills:</strong> {skills.join(", ")}</p>}
                <button className="script-button" type="button" onClick={generatePresentationScript}>Prepare introduction script</button>
                <p className="script-disclaimer">Template-generated demo text. It does not call an external AI service.</p>
                {scriptError && <p className="form-error" role="alert">{scriptError}</p>}
                {script && <div className="generated-script"><h4>Presentation script</h4><p className="preserve-lines">{script}</p><button className="copy-script-button" type="button" onClick={() => navigator.clipboard?.writeText(script)}>Copy script</button></div>}
              </div>
            )}
          </Window>
        ))}

        {minimized.length > 0 && (
          <div className="dock" aria-label="Minimized windows">
            {minimized.map((name) => (
              <button key={name} type="button" className="dock-item" onClick={() => openWindow(name)} aria-label={`Restore ${name} window`} title={`Restore ${name}`}>
                <img src={`/images/${name}.png`} alt="" />
              </button>
            ))}
          </div>
        )}

        {activeSocials.length > 0 && (
          <nav className="social-dock" aria-label="Social profiles">
            {activeSocials.map((item) => (
              <a key={item.key} href={social[item.key]} target="_blank" rel="noopener noreferrer" aria-label={item.label} title={item.label}>
                <img src={item.icon} alt="" />
              </a>
            ))}
          </nav>
        )}
      </section>
    </main>
  );
}
