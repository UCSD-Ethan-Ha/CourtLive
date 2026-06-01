type StatusBannerProps = {
  isOpen: boolean;
  nextChangeLabel: string;
};

export function StatusBanner({ isOpen, nextChangeLabel }: StatusBannerProps) {
  if (isOpen) {
    return null;
  }

  return (
    <div
      role="status"
      style={{
        width: "100%",
        padding: "0.85rem 1rem",
        background: "#fef3c7",
        borderBottom: "1px solid #f59e0b",
        color: "#78350f",
        fontSize: "0.95rem",
        fontWeight: 600,
        textAlign: "center",
        lineHeight: 1.45,
      }}
    >
      🏀 Courts are currently closed · {nextChangeLabel}
    </div>
  );
}
