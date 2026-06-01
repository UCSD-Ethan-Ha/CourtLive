import { useState, type FormEvent } from "react";

const UCSD_BLUE = "#00629B";
const UCSD_GOLD = "#FFCD00";
const UCSD_NAVY = "#182B49";

export function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <style>{`
        .cl-contact {
          max-width: 560px;
          margin: 0 auto;
          padding: 2rem 1rem 3rem;
        }

        .cl-contact h2 {
          margin: 0 0 0.35rem;
          font-size: 1.75rem;
          font-weight: 700;
          color: ${UCSD_NAVY};
        }

        .cl-contact-intro {
          margin: 0 0 1.5rem;
          color: #4b5563;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .cl-contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          background: #fff;
          border: 2px solid ${UCSD_BLUE};
          border-top: 4px solid ${UCSD_GOLD};
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 8px 24px rgba(0, 98, 155, 0.1);
        }

        .cl-contact-label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: ${UCSD_NAVY};
        }

        .cl-contact-input,
        .cl-contact-textarea {
          font-family: inherit;
          font-size: 1rem;
          padding: 0.65rem 0.75rem;
          border: 2px solid #93c5e8;
          border-radius: 8px;
          color: #1f2937;
        }

        .cl-contact-input:focus-visible,
        .cl-contact-textarea:focus-visible {
          outline: 2px solid ${UCSD_BLUE};
          outline-offset: 1px;
          border-color: ${UCSD_BLUE};
        }

        .cl-contact-textarea {
          min-height: 140px;
          resize: vertical;
        }

        .cl-contact-submit {
          align-self: flex-start;
          padding: 0.65rem 1.4rem;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          color: ${UCSD_NAVY};
          background: ${UCSD_GOLD};
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .cl-contact-submit:hover {
          background: #ffe566;
        }

        .cl-contact-success {
          margin: 0;
          padding: 1rem;
          background: #ecfdf5;
          border: 1px solid #86efac;
          border-radius: 8px;
          color: #15803d;
          font-weight: 600;
        }
      `}</style>

      <section className="cl-contact">
        <h2>Contact us</h2>
        <p className="cl-contact-intro">
          Questions about court availability or the CourtLive project? Send us a
          message below. (This form is for demo purposes and does not send
          email.)
        </p>

        {submitted ? (
          <p className="cl-contact-success" role="status">
            Thanks — your message was recorded locally. We&apos;ll be in touch
            soon.
          </p>
        ) : (
          <form className="cl-contact-form" onSubmit={handleSubmit}>
            <label className="cl-contact-label">
              Email
              <input
                className="cl-contact-input"
                type="email"
                name="email"
                required
                placeholder="you@ucsd.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="cl-contact-label">
              Message
              <textarea
                className="cl-contact-textarea"
                name="message"
                required
                placeholder="Write your message here…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

            <button type="submit" className="cl-contact-submit">
              Send message
            </button>
          </form>
        )}
      </section>
    </>
  );
}
