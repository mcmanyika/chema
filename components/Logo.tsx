import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={36}
      height={39}
      className={className}
      style={{ width: "auto", height: "auto" }}
    />
  );
}
