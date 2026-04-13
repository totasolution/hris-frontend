import { Card, CardBody, CardHeader } from './Card';
import type { DeclarationChecklistData } from '../services/api';

type Props = {
  data: DeclarationChecklistData;
  submittedAt?: string | null;
};

/** Read-only display of KETENTUAN / SANKSI / final declaration (same structure as onboarding & candidate detail). */
export function OnboardingDeclarationChecklistView({ data, submittedAt }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-headline">Declaration list</h3>
        {submittedAt && (
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Submitted on {new Date(submittedAt).toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardBody className="space-y-8">
        <div>
          <h4 className="text-xs font-bold text-brand uppercase tracking-wider mb-4">KETENTUAN</h4>
          <ul className="space-y-3">
            {data.ketentuan?.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                <span
                  className={`shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${
                    item.checked ? 'bg-green-100 border-green-300 text-green-600' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {item.checked ? '✓' : '—'}
                </span>
                <div className="min-w-0">
                  <span>
                    <span className="font-medium">{idx + 1}. </span>
                    {item.text}
                  </span>
                  {item.subItems && (
                    <ul className="mt-2 ml-4 list-disc space-y-1 text-slate-600">
                      {item.subItems.map((sub, i) => (
                        <li key={i}>{sub}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-brand uppercase tracking-wider mb-4">SANKSI</h4>
          <ul className="space-y-3">
            {data.sanksi?.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                <span
                  className={`shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${
                    item.checked ? 'bg-green-100 border-green-300 text-green-600' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {item.checked ? '✓' : '—'}
                </span>
                <span>
                  <span className="font-medium">{idx + 1}. </span>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <span
              className={`shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${
                data.finalDeclaration?.checked ? 'bg-green-100 border-green-300 text-green-600' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {data.finalDeclaration?.checked ? '✓' : '—'}
            </span>
            <div className="min-w-0">
              {data.finalDeclaration?.text?.split('\n\n').map((para, i) => (
                <p key={i} className={i > 0 ? 'mt-3' : ''}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
