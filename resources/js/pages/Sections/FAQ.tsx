import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'What is this platform used for?',
    answer:
      'Gearhead Carwash provides professional car wash and detailing services that you can easily book online.',
  },
  {
    question: 'Do I need to book an appointment?',
    answer:
      'Appointments are recommended to avoid waiting time, but walk-ins are welcome depending on availability.',
  },
  {
    question: 'How long does a car wash take?',
    answer: 'A basic wash takes around 20–30 minutes. Detailing services may take longer.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'Payments can be made via cash or GCash.',
  },
  {
    question: 'Is my vehicle safe at Gearhead Carwash?',
    answer:
      'Yes. Our trained staff uses safe equipment and quality products to ensure your vehicle is well taken care of.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full bg-background py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[95rem] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-14 lg:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="text-foreground">Frequently Asked </span>
            <span className="text-yellow-500 dark:text-highlight">Questions</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg md:max-w-3xl md:text-xl">
            Got questions? We've got answers. Find everything you need to know about our car wash
            services, booking process, and payment options.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6 md:space-y-8">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx

            return (
              <div
                key={idx}
                className="rounded-2xl border border-border p-5 shadow-lg transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="group flex w-full items-center justify-between text-left"
                >
                  <span className="pr-3 text-base font-medium text-foreground sm:text-lg md:text-xl">
                    {item.question}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 sm:h-6 sm:w-6 ${isOpen ? 'rotate-180' : ''} `}
                  />
                </button>

                {isOpen && (
                  <div className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
