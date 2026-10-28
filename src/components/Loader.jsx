
import { LoaderCircle } from "lucide-react";

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 text-gray-600">
      <LoaderCircle className="animate-spin" size={22} />
      <span>{text}</span>
    </div>
  );
}
