import type { Metadata } from "next";
import "./landing-v4.css";
import { IndexV4Content } from "./IndexV4Content";

export const metadata: Metadata = {
  title: "LEVEL UP",
  robots: { index: false, follow: false },
};

export default function IndexV4Page() {
  return <IndexV4Content />;
}
