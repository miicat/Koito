import { ExternalLinkIcon } from "lucide-react";
import { useAppContext } from "~/providers/AppProvider";

export default function Footer() {
  const { currentVersion } = useAppContext();

  return (
    <div className="mx-auto py-10 pt-20 color-fg-tertiary text-sm">
      <ul className="flex flex-col items-center justify-around">
        <li>Koito {currentVersion}</li>
        <li>
          <a
            href="https://github.com/miicat/Koito"
            target="_blank"
            className="link-underline"
          >
            View the source on GitHub{" "}
            <ExternalLinkIcon className="inline mb-1" size={14} />
          </a>
        </li>
        <li>
          Fork of{" "}
          <a
            href="https://github.com/gabehf/koito"
            target="_blank"
            className="link-underline"
          >
            gabehf/koito{" "}
            <ExternalLinkIcon className="inline mb-1" size={14} />
          </a>
        </li>
      </ul>
    </div>
  );
}
