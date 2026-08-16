import Image from "next/image";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function LandingChatPreview({ lang }: { lang: Lang }) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[28px] overflow-hidden bg-[#111] border border-line">
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
        <Image
          src="/brand/icon.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg object-contain"
        />
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">{t(lang, "salonDemo")}</div>
          <div className="text-[11px] text-white/80">{t(lang, "chatStatus")}</div>
        </div>
      </div>
      <div className="wa-pattern px-3 py-4 min-h-[280px] space-y-2">
        <div className="ml-auto max-w-[85%] bg-[#dcf8c6] rounded-lg rounded-tr-none px-2.5 py-2 text-[14px] whitespace-pre-wrap text-navy">
          {t(lang, "chatClient")}
        </div>
        <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none px-2.5 py-2 text-[14px] whitespace-pre-wrap text-navy">
          {t(lang, "chatBot")}
        </div>
      </div>
    </div>
  );
}
