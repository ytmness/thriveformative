"use client";

import { useState } from "react";

type PatientAvatarProps = {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "small" | "medium" | "large" | "xlarge";
  className?: string;
};

export function PatientAvatar({ firstName, lastName, photoUrl, size = "medium", className = "" }: PatientAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  
  const sizeClasses = {
    small: "w-8 h-8 text-sm",
    medium: "w-12 h-12 text-base",
    large: "w-20 h-20 text-xl",
    xlarge: "w-32 h-32 text-3xl",
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-medium ${className}`;

  if (photoUrl && !imageError) {
    return (
      <div className={`${baseClasses} overflow-hidden bg-[rgb(var(--primary)/0.22)]`}>
        <img 
          src={photoUrl} 
          alt={`${firstName} ${lastName}`} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} bg-[rgb(var(--primary))] text-white`}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
