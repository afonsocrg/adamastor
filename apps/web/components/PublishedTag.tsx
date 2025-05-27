interface PublishedTagProps {
  is_public: boolean;
}
export function PublishedTag({ is_public }: PublishedTagProps) {
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        is_public
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {is_public ? "Published" : "Draft"}
    </span>
  );
}
