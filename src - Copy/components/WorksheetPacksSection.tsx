import { useMemo, useState } from 'react';
import { Download, FolderOpen, Lock, SlidersHorizontal, Stamp, X } from 'lucide-react';
import { t } from '../i18n';
import { downloadTextOrHtmlFile } from '../utils/download';
import type {
  AcademySettings,
  Lang,
  PaymentIntent,
  WorksheetLevel,
  WorksheetPack,
  WorksheetPackItem,
  WorksheetTrack,
} from '../types';

interface WorksheetPacksSectionProps {
  lang: Lang;
  packs: WorksheetPack[];
  items: WorksheetPackItem[];
  settings: AcademySettings;
  isAdmin: boolean;
  onOpenAdminPacks: () => void;
  onRequestPayment: (intent: PaymentIntent) => void;
}

export function WorksheetPacksSection({
  lang,
  packs,
  items,
  settings,
  isAdmin,
  onOpenAdminPacks,
  onRequestPayment,
}: WorksheetPacksSectionProps) {
  const labels = t(lang);
  const [levelFilter, setLevelFilter] = useState<'all' | WorksheetLevel>('all');
  const [trackFilter, setTrackFilter] = useState<'all' | WorksheetTrack>('all');
  const [activePack, setActivePack] = useState<WorksheetPack | null>(null);

  const getLevelLabel = (level: WorksheetLevel) => {
    switch (level) {
      case 'age_3_5':
        return labels.packLevelAge35;
      case 'age_5_7':
        return labels.packLevelAge57;
      case 'primary':
        return labels.packLevelPrimary;
      case 'prep_sec':
        return labels.packLevelPrepSec;
    }
  };

  const getTrackLabel = (track: WorksheetTrack) => {
    switch (track) {
      case 'arabic_letters':
        return labels.packTrackArabic;
      case 'english_letters':
        return labels.packTrackEnglish;
      case 'numbers':
        return labels.packTrackNumbers;
      case 'writing_skills':
        return labels.packTrackWriting;
      case 'general':
        return labels.packTrackGeneral;
    }
  };

  const sortedAndFilteredPacks = useMemo(() => {
    return [...packs]
      .filter((p) => {
        if (levelFilter !== 'all' && p.levelId !== levelFilter) return false;
        if (trackFilter !== 'all' && p.track !== trackFilter) return false;
        return true;
      })
      .sort((a, b) => a.packNumber - b.packNumber);
  }, [packs, levelFilter, trackFilter]);

  const activePackItems = useMemo(() => {
    if (!activePack) return [];
    return items
      .filter((sheet) => sheet.packId === activePack.id)
      .sort((a, b) => a.itemOrder - b.itemOrder);
  }, [items, activePack]);

  return (
    <section id="worksheet-library" className="py-16 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {labels.packsTitle}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">{labels.packsLead}</p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminPacks}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة رقم ومجموعة أوراق' : 'Manage Worksheet Packs'}</span>
            </button>
          )}
        </div>

        {/* Level/Age & Track Filter Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit max-w-full">
            {(
              [
                ['all', labels.packAllLevels],
                ['age_3_5', labels.packLevelAge35],
                ['age_5_7', labels.packLevelAge57],
                ['primary', labels.packLevelPrimary],
                ['prep_sec', labels.packLevelPrepSec],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLevelFilter(key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  levelFilter === key
                    ? 'bg-sky-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            {(
              [
                ['all', labels.packAllTracks],
                ['arabic_letters', labels.packTrackArabic],
                ['english_letters', labels.packTrackEnglish],
                ['numbers', labels.packTrackNumbers],
                ['writing_skills', labels.packTrackWriting],
                ['general', labels.packTrackGeneral],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTrackFilter(key)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                  trackFilter === key
                    ? 'border-sky-900 bg-sky-50 text-sky-950'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Numbered Pack Grid */}
        {sortedAndFilteredPacks.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
            {labels.emptyItems}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedAndFilteredPacks.map((pack) => {
              const packSheets = items.filter((s) => s.packId === pack.id);
              const formattedNumber = String(pack.packNumber).padStart(2, '0');

              return (
                <article
                  key={pack.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-num font-bold text-sky-900">
                        {labels.packNumberPrefix} {formattedNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{getLevelLabel(pack.levelId)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getTrackLabel(pack.track)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">
                        {packSheets.length} {labels.packSheetsUnit}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          pack.isPaid
                            ? 'font-semibold text-amber-700 font-mono-num'
                            : 'font-semibold text-emerald-700'
                        }
                      >
                        {pack.isPaid ? `${pack.priceEgp} ${labels.egp}` : labels.freeLabel}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      <span className="font-mono-num text-sky-900 me-2">{formattedNumber}.</span>
                      {lang === 'ar' ? pack.titleAr : pack.titleEn}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {lang === 'ar' ? pack.descriptionAr : pack.descriptionEn}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePack(pack)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors whitespace-nowrap"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>
                          {labels.packOpenBtn} ({packSheets.length})
                        </span>
                      </button>

                      {pack.isPaid && (
                        <button
                          type="button"
                          onClick={() =>
                            onRequestPayment({
                              itemType: 'worksheet_pack',
                              itemTitle: `${labels.packNumberPrefix} ${formattedNumber}: ${
                                lang === 'ar' ? pack.titleAr : pack.titleEn
                              }`,
                              amountEgp: pack.priceEgp,
                            })
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-amber-950 bg-amber-100 border border-amber-300 rounded-xl hover:bg-amber-200 transition-colors whitespace-nowrap"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {pack.priceEgp} {labels.egp}
                          </span>
                        </button>
                      )}
                    </div>

                    {pack.allowWhiteLabel && (
                      <button
                        type="button"
                        onClick={() =>
                          onRequestPayment({
                            itemType: 'whitelabel',
                            itemTitle: `${
                              lang === 'ar' ? 'نسخة مخصصة بدون لوجو:' : 'White-Label Edition:'
                            } ${labels.packNumberPrefix} ${formattedNumber} - ${
                              lang === 'ar' ? pack.titleAr : pack.titleEn
                            }`,
                            amountEgp: settings.whiteLabelPriceEgp,
                            allowCustomBranding: true,
                          })
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap"
                      >
                        <Stamp className="w-3.5 h-3.5 text-amber-700" />
                        <span>
                          {labels.customBrandBtn} · {settings.whiteLabelPriceEgp} {labels.egp}
                        </span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Pack Sheets Modal */}
      {activePack && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  <span className="font-mono-num font-bold text-sky-900">
                    {labels.packNumberPrefix} {String(activePack.packNumber).padStart(2, '0')}
                  </span>
                  {' · '}
                  <span>{getLevelLabel(activePack.levelId)}</span>
                  {' · '}
                  <span>{getTrackLabel(activePack.track)}</span>
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'ar' ? activePack.titleAr : activePack.titleEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePack(null)}
                aria-label={labels.closeBtn}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activePackItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{labels.emptyItems}</p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {activePackItems.map((sheet) => {
                  const canDownloadFree = !activePack.isPaid || sheet.isFreeSample;
                  const kindText =
                    sheet.kind === 'worksheet' ? labels.catWorksheet : labels.catActivity;

                  return (
                    <div
                      key={sheet.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs text-slate-500">
                          <span className="font-mono-num font-semibold text-sky-900">
                            #{sheet.itemOrder}
                          </span>
                          {' · '}
                          <span>{kindText}</span>
                          {' · '}
                          <span>{labels.nonInteractiveLabel}</span>
                          {activePack.isPaid && sheet.isFreeSample && (
                            <>
                              {' · '}
                              <span className="font-semibold text-emerald-700">
                                {labels.packSampleBadge}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {lang === 'ar' ? sheet.titleAr : sheet.titleEn}
                        </p>
                      </div>

                      {canDownloadFree ? (
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextOrHtmlFile({
                              fileName: sheet.fileName || `${sheet.id}.html`,
                              title: lang === 'ar' ? sheet.titleAr : sheet.titleEn,
                              subtitle: `${labels.packNumberPrefix} ${activePack.packNumber} · ${getLevelLabel(activePack.levelId)}`,
                              bodyText: sheet.contentText,
                              fileDataUrl: sheet.fileDataUrl,
                              brandHeader: lang === 'ar' ? settings.academyNameAr : settings.academyNameEn,
                              logoDataUrl: settings.logoDataUrl,
                            })
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{labels.downloadBtn}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const packToBuy = activePack;
                            setActivePack(null);
                            onRequestPayment({
                              itemType: 'worksheet_pack',
                              itemTitle: `${labels.packNumberPrefix} ${String(
                                packToBuy.packNumber
                              ).padStart(2, '0')}: ${
                                lang === 'ar' ? packToBuy.titleAr : packToBuy.titleEn
                              }`,
                              amountEgp: packToBuy.priceEgp,
                            });
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-900 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {labels.buyInstapayBtn} · {activePack.priceEgp} {labels.egp}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivePack(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                {labels.closeBtn}
              </button>

              {activePack.isPaid && (
                <button
                  type="button"
                  onClick={() => {
                    const packToBuy = activePack;
                    setActivePack(null);
                    onRequestPayment({
                      itemType: 'worksheet_pack',
                      itemTitle: `${labels.packNumberPrefix} ${String(
                        packToBuy.packNumber
                      ).padStart(2, '0')}: ${
                        lang === 'ar' ? packToBuy.titleAr : packToBuy.titleEn
                      }`,
                      amountEgp: packToBuy.priceEgp,
                    });
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                >
                  {labels.buyInstapayBtn} · {activePack.priceEgp} {labels.egp}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
