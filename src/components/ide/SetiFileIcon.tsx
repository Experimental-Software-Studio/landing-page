import rawDefinitions from "@peoplesgrocers/seti-ui-file-icons/lib/definitions.json";
import rawIcons from "@peoplesgrocers/seti-ui-file-icons/lib/icons.json";

type IconDetails = [string, keyof typeof setiColors];

const setiColors = {
  blue: "#519aba",
  grey: "#4d5a5e",
  "grey-light": "#6d8086",
  green: "#8dc149",
  orange: "#e37933",
  pink: "#f55385",
  purple: "#a074c4",
  red: "#cc3e44",
  white: "#d4d7d6",
  yellow: "#cbcb41",
  ignore: "#41535b",
};

interface SetiDefinitions {
  default: IconDetails;
  extensions: Record<string, IconDetails>;
  files: Record<string, IconDetails>;
  partials: [string, IconDetails][];
}

type SetiIcons = Record<string, string>;

const definitions = rawDefinitions as unknown as SetiDefinitions;
const icons = rawIcons as unknown as SetiIcons;

function getIconDetails(fileName: string): IconDetails {
  const fileMatch = definitions.files[fileName];

  if (fileMatch) {
    return fileMatch;
  }

  let extension = fileName.slice(fileName.indexOf("."));

  while (extension !== "") {
    const extensionMatch = definitions.extensions[extension];

    if (extensionMatch) {
      return extensionMatch;
    }

    extension = extension.slice(1);
    extension = extension.slice(extension.indexOf("."));
  }

  const partialMatch = definitions.partials.find(([partial]) => fileName.includes(partial));

  return partialMatch?.[1] ?? definitions.default;
}

interface SetiFileIconProps {
  fileName: string;
}

export function SetiFileIcon({ fileName }: SetiFileIconProps) {
  const [iconName, colorName] = getIconDetails(fileName);
  const svg = icons[iconName] ?? icons[definitions.default[0]];

  return (
    <span
      className="seti-file-icon"
      style={{ color: setiColors[colorName] }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
