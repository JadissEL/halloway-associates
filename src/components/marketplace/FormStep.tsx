export function FormStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex gap-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-luxury-gold/50 font-serif text-sm text-luxury-gold">
        {number}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <legend className="text-sm font-semibold uppercase tracking-wide text-luxury-ivory">{title}</legend>
        {children}
      </div>
    </fieldset>
  );
}
