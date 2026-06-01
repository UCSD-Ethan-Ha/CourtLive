export type Page = "home" | "contact";

type NavbarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

const UCSD_BLUE = "#00629B";
const UCSD_GOLD = "#FFCD00";
const UCSD_NAVY = "#182B49";

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <>
      <style>{`
        .cl-navbar {
          background: linear-gradient(90deg, ${UCSD_NAVY} 0%, ${UCSD_BLUE} 100%);
          border-bottom: 3px solid ${UCSD_GOLD};
          padding: 0 1rem;
        }

        .cl-navbar-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          min-height: 3.5rem;
        }

        .cl-navbar-brand {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          cursor: pointer;
        }

        .cl-navbar-brand span {
          color: ${UCSD_GOLD};
        }

        .cl-navbar-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .cl-nav-btn {
          display: inline-block;
          padding: 0.45rem 0.9rem;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          border: 2px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }

        .cl-nav-btn-about {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border-color: rgba(255, 205, 0, 0.35);
        }

        .cl-nav-btn-about:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: ${UCSD_GOLD};
        }

        .cl-nav-btn-contact {
          background: ${UCSD_GOLD};
          color: ${UCSD_NAVY};
          border: none;
        }

        .cl-nav-btn-contact:hover {
          background: #ffe566;
        }

        .cl-nav-btn-contact.active {
          box-shadow: 0 0 0 2px #fff;
        }
      `}</style>

      <nav className="cl-navbar" aria-label="Main navigation">
        <div className="cl-navbar-inner">
          <button
            type="button"
            className="cl-navbar-brand"
            onClick={() => onNavigate("home")}
          >
            Court<span>Live</span>
          </button>

          <div className="cl-navbar-links">
            <a
              className="cl-nav-btn cl-nav-btn-about"
              href="https://myrepo-livid-seven.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              About us
            </a>
            <button
              type="button"
              className={`cl-nav-btn cl-nav-btn-contact${currentPage === "contact" ? " active" : ""}`}
              onClick={() => onNavigate("contact")}
            >
              Contact us
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
