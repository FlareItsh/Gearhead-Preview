import FloatingPromotions from '@/components/FloatingPromotions'
import Header from '@/components/Header'
import { Head } from '@inertiajs/react'
import About from './Sections/About'
import FAQSection from './Sections/FAQ'
import Footer from './Sections/Footer'
import Hero from './Sections/Hero'
import LP_Services from './Sections/LP_Services'
import Review from './Sections/Review'

export default function Welcome({ discounts, reviews }: { discounts?: any[]; reviews?: any[] }) {
  return (
    <>
      <Head title="Welcome">
        <link
          rel="preconnect"
          href="https://fonts.bunny.net"
        />
        <link
          href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
          rel="stylesheet"
        />
      </Head>

      <Header />

      <section
        id="home"
        className="scroll-mt-18"
      >
        <Hero />
      </section>

      <FloatingPromotions discounts={discounts} />

      <section
        id="about"
        className="scroll-mt-10"
      >
        <About />
      </section>

      <section
        id="services"
        className="scroll-mt-10"
      >
        <LP_Services />
      </section>

      <section
        id="review"
        className="scroll-mt-18"
      >
        <Review reviews={reviews} />
      </section>

      <section
        id="contact"
        className="scroll-mt-18 bg-black"
      >
        <FAQSection />
      </section>

      <section
        id="footer"
        className="scroll-mt-18"
      >
        <Footer />
      </section>
    </>
  )
}
