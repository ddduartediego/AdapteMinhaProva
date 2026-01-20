import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileText, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoginButton } from '@/components/auth/login-button'

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Adapte Minha Prova
            </span>
          </Link>
          <LoginButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm backdrop-blur-sm opacity-0 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Powered by AI</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl opacity-0 animate-fade-in animate-delay-100">
            Adapte sua prova{' '}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-accent bg-clip-text text-transparent">
              em minutos
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl opacity-0 animate-fade-in animate-delay-200">
            Transforme suas provas em PDF em versões adaptadas para alunos com 
            <strong className="text-foreground"> DI, TEA, Dislexia, TDAH </strong>
            e outras necessidades especiais usando inteligência artificial.
          </p>
          
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center opacity-0 animate-fade-in animate-delay-300">
            <LoginButton size="xl" showIcon />
            <Button variant="outline" size="xl" asChild>
              <Link href="#como-funciona">
                Saiba mais
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground opacity-0 animate-fade-in animate-delay-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>Gratuito para começar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>BNCC identificada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>Google Docs integrado</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-t bg-background/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Como funciona</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Três passos simples para adaptar suas provas
            </p>
          </div>
          
          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white font-bold">
                1
              </div>
              <div className="mt-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Envie seu PDF</h3>
                <p className="mt-2 text-muted-foreground">
                  Faça upload da sua prova em PDF (texto selecionável). Informe disciplina, 
                  ano/série e selecione as adaptações desejadas.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white font-bold">
                2
              </div>
              <div className="mt-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">IA processa</h3>
                <p className="mt-2 text-muted-foreground">
                  Nossa IA identifica BNCC, Bloom e estrutura da prova. Para DI, você informa 
                  as respostas corretas das questões objetivas.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white font-bold">
                3
              </div>
              <div className="mt-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
                  <Zap className="h-7 w-7 text-success" />
                </div>
                <h3 className="text-xl font-semibold">Receba versões</h3>
                <p className="mt-2 text-muted-foreground">
                  Acesse suas provas adaptadas diretamente no Google Docs, compartilhadas 
                  com seu email. Baixe em PDF quando preferir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions supported */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Adaptações disponíveis</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Suportamos diversas condições para inclusão educacional
            </p>
          </div>
          
          <div className="mx-auto max-w-4xl grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🧠', label: 'Deficiência Intelectual (DI)', desc: 'Simplificação de linguagem e apoio visual' },
              { icon: '🧩', label: 'TEA', desc: 'Estrutura clara e previsível' },
              { icon: '📖', label: 'Dislexia', desc: 'Tipografia adaptada e espaçamento' },
              { icon: '✏️', label: 'Disgrafia', desc: 'Espaços ampliados para respostas' },
              { icon: '🔢', label: 'Discalculia', desc: 'Apoio visual para cálculos' },
              { icon: '⚡', label: 'TDAH', desc: 'Fragmentação e destaque de comandos' },
            ].map((condition) => (
              <div
                key={condition.label}
                className="rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="text-3xl">{condition.icon}</span>
                <h3 className="mt-3 font-semibold">{condition.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{condition.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-gradient-to-b from-background to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Pronto para começar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Junte-se a professores que já estão economizando tempo e promovendo inclusão.
          </p>
          <div className="mt-8">
            <LoginButton size="xl" showIcon />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Adapte Minha Prova</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Adapte Minha Prova. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
