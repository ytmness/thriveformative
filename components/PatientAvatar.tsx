type PatientAvatarProps = {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "small" | "medium" | "large";
  className?: string;
};

export function PatientAvatar({ firstName, lastName, photoUrl, size = "medium", className = "" }: PatientAvatarProps) {
  const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  
  const sizeClasses = {
    small: "w-8 h-8 text-sm",
    medium: "w-12 h-12 text-base",
    large: "w-16 h-16 text-xl",
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-medium ${className}`;

  if (photoUrl) {
    return (
      <div className={`${baseClasses} overflow-hidden bg-gray-200`}>
        <img 
          src={photoUrl} 
          alt={`${firstName} ${lastName}`} 
          className="w-full h-full object-cover"
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
