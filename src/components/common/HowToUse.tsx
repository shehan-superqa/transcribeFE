import './HowToUse.css';

interface HowToUseProps {
  title: string;
  subtitle: string;
  instructions: string;
}

export default function HowToUse({ title, subtitle, instructions }: HowToUseProps) {
  return (
    <div className="how-to-use-container">
      {title && (
        <div className="how-to-use-title-wrapper">
          <h1 className="how-to-use-title">{title}</h1>
        </div>
      )}
      <p className="how-to-use-subtitle">{subtitle}</p>
      <div className="how-to-use-box">
        <strong className="how-to-use-heading">How to use:</strong>
        <p className="how-to-use-text">{instructions}</p>
      </div>
    </div>
  );
}

