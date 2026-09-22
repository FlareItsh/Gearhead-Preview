export default function Heading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-3xl font-black tracking-tight md:text-4xl text-foreground">{title}</h2>
      {description && <p className="text-sm font-medium text-muted-foreground/70 md:text-base">{description}</p>}
    </div>
  )
}
