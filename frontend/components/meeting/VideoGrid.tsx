import React from "react";

interface VideoGridProps {
  children: React.ReactNode;
}

export default function VideoGrid({ children }: VideoGridProps) {
  // A responsive grid that adjusts columns based on child count
  const count = React.Children.count(children);
  
  let gridCols = "grid-cols-1";
  if (count === 2) gridCols = "grid-cols-1 md:grid-cols-2";
  else if (count >= 3 && count <= 4) gridCols = "grid-cols-2";
  else if (count >= 5 && count <= 9) gridCols = "grid-cols-2 md:grid-cols-3";
  else if (count > 9) gridCols = "grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

  return (
    <div className={`w-full h-full p-4 grid gap-4 ${gridCols} content-center overflow-auto max-h-[calc(100vh-120px)]`}>
      {children}
    </div>
  );
}
