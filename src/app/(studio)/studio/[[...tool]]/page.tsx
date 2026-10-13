import { NextStudio } from "next-sanity/studio";
import config from "../../../../../sanity.config";

// Studio-metadata: niet indexeren en mobielvriendelijke viewport.
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
