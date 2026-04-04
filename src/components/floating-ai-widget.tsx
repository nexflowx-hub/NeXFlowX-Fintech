'use client';

import { useState } from 'react';
import { MessageCircle, Zap, Send, Bot } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// ─── Chat Messages (Placeholder) ──────────────────────────────────────────

interface ChatMessage {
  role: 'bot';
  text: string;
}

const placeholderMessages: ChatMessage[] = [
  {
    role: 'bot',
    text: 'Olá! Sou o assistente virtual da NeXFlowX. Em breve poderei ajudá-lo com consultas sobre transações, saldos e suporte técnico.',
  },
  {
    role: 'bot',
    text: 'Esta funcionalidade estará disponível na próxima atualização.',
  },
];

// ─── Bot Message Bubble ────────────────────────────────────────────────────

function BotMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 max-w-[90%]">
      <div className="shrink-0 mt-0.5 p-1.5 rounded-full bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.2)]">
        <Bot className="w-3.5 h-3.5 text-[#00FF41]" />
      </div>
      <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.4)]">
        <p className="text-xs text-[#888899] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function FloatingAIWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── FAB Button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center
          cyber-btn-primary cyber-breathe shadow-lg hover:scale-105 active:scale-95 transition-transform"
        aria-label="Abrir assistente AI"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* ── Sheet (Chat Panel) ─────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="bg-[rgba(10,10,14,0.97)] backdrop-blur-xl border-l border-[rgba(51,51,51,0.6)]
            sm:max-w-md flex flex-col p-0"
        >
          {/* ── Header ────────────────────────────────────────────── */}
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-[rgba(51,51,51,0.4)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.2)]">
                  <Zap className="w-5 h-5 text-[#00FF41]" />
                </div>
                <div>
                  <SheetTitle className="text-base text-[#E0E0E8] flex items-center gap-2">
                    NeXFlowX AI Assistant
                  </SheetTitle>
                  <SheetDescription className="text-[10px] cyber-mono text-[#555566] mt-0.5">
                    Assistente virtual inteligente
                  </SheetDescription>
                </div>
              </div>
              <span className="cyber-badge cyber-badge-amber">EM BREVE</span>
            </div>
          </SheetHeader>

          {/* ── Chat Messages ─────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto cyber-scrollbar px-5 py-4 space-y-4">
            {/* Welcome indicator */}
            <div className="flex items-center justify-center py-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(25,25,35,0.5)] border border-[rgba(51,51,51,0.3)]">
                <span className="status-dot active" style={{ width: '6px', height: '6px' }} />
                <span className="text-[10px] cyber-mono text-[#555566]">MENSAGENS PREVIEW</span>
              </div>
            </div>

            {placeholderMessages.map((msg, idx) => (
              <BotMessage key={idx} text={msg.text} />
            ))}
          </div>

          {/* ── Input Area ────────────────────────────────────────── */}
          <div className="px-5 py-4 border-t border-[rgba(51,51,51,0.4)]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                disabled
                placeholder="Aguardando ativação..."
                className="flex-1 px-4 py-2.5 rounded-lg text-sm cyber-input opacity-40 cursor-not-allowed"
              />
              <button
                disabled
                className="p-2.5 rounded-lg cyber-btn-primary opacity-40 cursor-not-allowed"
                aria-label="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-[#555566] cyber-mono mt-2 text-center">
              O assistente AI estará disponível numa futura atualização.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
