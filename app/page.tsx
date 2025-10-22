import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { ArrowRight, BarChart3, Receipt, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold text-balance">Meet Tobby, Your Financial Companion</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-pretty">
                Tobby automatically processes receipts via Telegram and gives you instant insights into your spending habits. Simple,
                friendly, and intelligent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage expenses</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Smart Receipt Processing</h3>
                <p className="text-muted-foreground text-pretty">
                  Send receipt photos via Telegram and let AI automatically extract and categorize your expenses
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Insightful Analytics</h3>
                <p className="text-muted-foreground text-pretty">
                  Visualize your spending patterns with intuitive charts and detailed breakdowns
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Secure & Private</h3>
                <p className="text-muted-foreground text-pretty">
                  Your financial data is encrypted and protected with enterprise-grade security
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
