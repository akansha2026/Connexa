import React from "react";
import clsx from "clsx";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "p"
  | "blockquote"
  | "inlineCode"
  | "lead"
  | "large"
  | "small"
  | "muted";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant: TypographyVariant;
  children: React.ReactNode;
}

export function Typography({
  variant,
  children,
  className,
  ...props
}: TypographyProps) {
  const baseClasses = "scroll-m-20";
  const variants = {
    h1: clsx(
      baseClasses,
      "text-center text-4xl font-extrabold tracking-tight text-balance"
    ),
    h2: clsx(
      baseClasses,
      "border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
    ),
    h3: clsx(baseClasses, "text-2xl font-semibold tracking-tight"),
    h4: clsx(baseClasses, "text-xl font-semibold tracking-tight"),
    p: "leading-7 [&:not(:first-child)]:mt-6",
    blockquote: "mt-6 border-l-2 pl-6 italic",
    inlineCode:
      "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
    lead: "text-muted-foreground text-xl",
    large: "text-lg font-semibold",
    small: "text-sm leading-none font-medium",
    muted: "text-muted-foreground text-sm",
  };

  const combinedClassName = clsx(variants[variant], className);

  switch (variant) {
    case "h1":
      return (
        <h1 className={combinedClassName} {...props}>
          {children}
        </h1>
      );
    case "h2":
      return (
        <h2 className={combinedClassName} {...props}>
          {children}
        </h2>
      );
    case "h3":
      return (
        <h3 className={combinedClassName} {...props}>
          {children}
        </h3>
      );
    case "h4":
      return (
        <h4 className={combinedClassName} {...props}>
          {children}
        </h4>
      );
    case "p":
      return (
        <p className={combinedClassName} {...props}>
          {children}
        </p>
      );
    case "blockquote":
      return (
        <blockquote className={combinedClassName} {...props}>
          {children}
        </blockquote>
      );
    case "inlineCode":
      return (
        <code className={combinedClassName} {...props}>
          {children}
        </code>
      );
    case "lead":
      return (
        <p className={combinedClassName} {...props}>
          {children}
        </p>
      );
    case "large":
      return (
        <div className={combinedClassName} {...props}>
          {children}
        </div>
      );
    case "small":
      return (
        <small className={combinedClassName} {...props}>
          {children}
        </small>
      );
    case "muted":
      return (
        <p className={combinedClassName} {...props}>
          {children}
        </p>
      );
    default:
      return (
        <p className={combinedClassName} {...props}>
          {children}
        </p>
      );
  }
}
