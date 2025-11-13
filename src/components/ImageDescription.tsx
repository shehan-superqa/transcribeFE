import React from "react";
import "./ImageDescription.css";

interface ImageDescriptionProps {
  imageSrc: string;
  altText: string;
  title: string;
  description: string;
  reverse?: boolean; // 👈 new prop to flip layout
}

const ImageDescription: React.FC<ImageDescriptionProps> = ({
  imageSrc,
  altText,
  title,
  description,
  reverse = false,
}) => {
  return (
    <div
      className={`image-description-container ${
        reverse ? "reverse-layout" : ""
      }`}
    >
      <div className="image-wrapper">
        <img src={imageSrc} alt={altText} className="image" />
      </div>
      <div className="description-wrapper">
        <h2 className="title">{title}</h2>
        <p className="description">{description}</p>
      </div>
    </div>
  );
};

export default ImageDescription;
