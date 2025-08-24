import { LEDBackground } from "@/components/led-background"

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <LEDBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
          <h1 className="text-4xl font-bold text-white mb-4">Background LED Dinâmico</h1>
          <p className="text-white/80 text-lg">Mova o mouse ou toque na tela para interagir com os efeitos</p>
        </div>
      </div>
    </main>
  )
}
