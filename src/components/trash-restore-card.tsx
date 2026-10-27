export function TrashRestoreCard({ endpoint, id, title }: { endpoint: string; id: string; title: string }) {
  return <article className="card"><span className="tag">In trash</span><h3>{title}</h3><form action={endpoint} method="post"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="restore" /><button className="button outline" type="submit">Restore</button></form></article>;
}
