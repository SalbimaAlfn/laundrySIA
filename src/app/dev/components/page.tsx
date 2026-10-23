import { notFound } from "next/navigation";
import { ComponentsDemo } from "./components-demo";

export const metadata = {
  title: "Komponen desain",
};

export default function ComponentsPage() {
  // This page exists for design review during development only.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ComponentsDemo />;
}
