import { Link } from 'react-router';
import { Badge } from '../../../shared/ui/Badge';
import { Card } from '../../../shared/ui/Card';
import { kindLabels, kindSymbols, type CatalogItem } from '../domain/catalog';

export function ContentCard({ item }: { item: CatalogItem }) {
  return (
    <Card>
      <div className={'card-art kind-' + item.kind} aria-hidden="true">
        {kindSymbols[item.kind]}
      </div>
      <div className="card-body">
        <Badge kind={item.kind}>{kindLabels[item.kind]}</Badge>
        <h3>
          <Link to={'/konten/' + item.slug}>{item.title}</Link>
        </h3>
        <p className="card-meta">
          {item.level} · {item.grade} · {item.subject} · {item.topic}
        </p>
        <p className="card-summary">{item.summary}</p>
      </div>
    </Card>
  );
}
