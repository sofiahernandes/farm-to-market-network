import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ExitIcon({ size = 28, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 117 117"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M98.2312 63.375H39V53.625H98.2312L90.675 46.0688L97.5 39L117 58.5L97.5 78L90.675 70.9313L98.2312 63.375ZM73.125 43.875V24.375H24.375V92.625H73.125V73.125H82.875V92.625C82.875 95.3063 81.9203 97.6016 80.0109 99.5109C78.1016 101.42 75.8063 102.375 73.125 102.375H24.375C21.6937 102.375 19.3984 101.42 17.4891 99.5109C15.5797 97.6016 14.625 95.3063 14.625 92.625V24.375C14.625 21.6937 15.5797 19.3984 17.4891 17.4891C19.3984 15.5797 21.6937 14.625 24.375 14.625H73.125C75.8063 14.625 78.1016 15.5797 80.0109 17.4891C81.9203 19.3984 82.875 21.6937 82.875 24.375V43.875H73.125Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LogoIcon({ size = 28, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="var(--forest)" />
      <path
        d="M16 24V13"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 18C12 18 8.5 15.2 8.5 10C13 10 16 13 16 18Z"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 14.5C16 9.5 19.5 6.5 24 6.5C24 11.5 20.5 14.5 16 14.5Z"
        stroke="var(--lime)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="22" r="1.5" fill="var(--lime)" />
      <circle cx="25" cy="22" r="1.5" fill="var(--action-secondary)" />
    </svg>
  );
}

export function SproutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21V11" />
      <path d="M12 15C8 15 5 12.5 5 8c4 0 7 2.5 7 7Z" />
      <path d="M12 12c0-4.5 3-7 7-7 0 4.5-3 7-7 7Z" />
    </Icon>
  );
}

export function BasketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4 10 2 10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l2-10" />
      <path d="M3 10h18" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4" />
      <path d="M10 14v4" />
      <path d="M14 14v4" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z" />
      <circle cx="12" cy="9" r="2.5" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M18 20c0-3.3-2.7-6-6-6s-6 2.7-6 6" />
    </Icon>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </Icon>
  );
}

export { PinIcon as MapPinIcon, ShieldCheckIcon as ShieldIcon };
