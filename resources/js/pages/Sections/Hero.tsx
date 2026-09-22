import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

/* ============================
   COUNT UP ANIMATION
============================ */
function CountUp({ end, duration = 1500 }: { end: string; duration?: number }) {
  const [count, setCount] = useState('0')
  const ref = useRef<HTMLSpanElement | null>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true

          let start = 0
          const total = parseFloat(end.replace(/[^0-9.]/g, '')) || 0
          const suffix = end.replace(/[0-9.]/g, '')
          const increment = total / (duration / 16)

          const animate = () => {
            start += increment
            if (start < total) {
              setCount(Math.floor(start) + suffix)
              requestAnimationFrame(animate)
            } else {
              setCount(end)
            }
          }

          animate()
        }
      },
      { threshold: 0.4 },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count}</span>
}

/* ============================
   MOCK STATS
============================ */
const stats = [
  { value: '3+', label: 'Years', desc: 'Trusted car care and innovation.' },
  {
    value: '1k+',
    label: 'Happy Customers',
    highlight: true,
    desc: 'Who trust our quality service.',
  },
  {
    value: '1.2k+',
    label: 'Vehicles',
    desc: 'Washed monthly through automated booking.',
  },
]

export default function HeroSection() {
  const brands = ['Toyota', 'Ford', 'Honda', 'Mitsubishi', 'Kia', 'BYD', 'Tesla', 'Porsche']

  // handle deep link if page opened with hash
  useEffect(() => {
    if (window.location.hash === '#lp_services') {
      const el = document.getElementById('lp_services')
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 200)
    }
  }, [])

  return (
    <section className="relative w-full overflow-hidden bg-background text-foreground">
      {/* CAR IMAGE (TOP • RIGHT • FULL SCREEN) */}
      <div className="pointer-events-none absolute top-0 right-0 z-0 hidden h-screen w-auto items-start justify-end lg:flex">
        <img
          src="/hero-car.png"
          alt="Hero Car"
          className="h-screen w-auto object-contain object-right-top"
        />
      </div>

      {/* HERO CONTENT */}
      <div className="relative z-20 mx-auto grid min-h-[calc(100vh-80px)] max-w-[95rem] grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
        {/* LEFT TEXT */}
        <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
          <h1 className="text-4xl leading-tight font-medium sm:text-5xl md:text-6xl lg:text-7xl">
            Bringing Your Car's <br />
            <span className="text-yellow-500 dark:text-[#FFD600]">Shine</span> Back to Life
          </h1>

          <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Experience the ultimate car care with Gearhead Carwash. Professional service,
            cutting-edge technology, and unmatched attention to detail.
          </p>

          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/services">
              <Button
                variant="highlight"
                className="hover:bg-yellow-400"
              >
                Book Now
              </Button>
            </Link>

            <a href="#services">
              <Button
                variant="outline"
                className="text-yellow-black border-0 font-semibold hover:bg-highlight hover:text-black dark:text-yellow-400 dark:hover:text-black"
              >
                View Services
              </Button>
            </a>
          </div>

          {/* STATS */}
          <div className="mt-8 grid grid-cols-3 gap-3 sm:mt-12 sm:gap-6 lg:gap-8">
            {stats.map((item, index) => (
              <Card
                key={index}
                className="border-0 bg-transparent shadow-none"
              >
                <CardContent className="p-0">
                  <p className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                    {item.highlight ? (
                      <span className="text-yellow-500 dark:text-[#FFD600]">
                        <CountUp end={item.value} />
                      </span>
                    ) : (
                      <CountUp end={item.value} />
                    )}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">
                    {item.label === 'Happy Customers' ? (
                      <>
                        <span className="text-yellow-500 dark:text-[#FFD600]">Happy</span> Customers
                      </>
                    ) : (
                      item.label
                    )}
                  </p>

                  <p className="mt-1 hidden text-xs text-muted-foreground lg:block">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* BRANDS MARQUEE */}
      <div className="absolute bottom-0 z-20 w-full overflow-hidden py-4 sm:py-6">
        <div className="carousel-track carousel-track-brands">
          {[...brands, ...brands, ...brands, ...brands].map((brand, i) => (
            <img
              key={i}
              src={`/${brand}.png`}
              className="h-5 flex-shrink-0 sm:h-6 md:h-7 dark:invert"
              alt={`${brand} logo`}
            />
          ))}
        </div>

        <style>{`
                    .carousel-track-brands {
                        display: flex;
                        gap: 3rem;
                        width: fit-content;
                        animation: scroll-brands 40s linear infinite;
                    }

                    @media (min-width: 640px) {
                        .carousel-track-brands {
                            gap: 5rem;
                        }
                    }

                    @media (min-width: 768px) {
                        .carousel-track-brands {
                            gap: 6rem;
                        }
                    }

                    @media (min-width: 1024px) {
                        .carousel-track-brands {
                            gap: 8rem;
                        }
                    }

                    @keyframes scroll-brands {
                        from {
                            transform: translateX(0);
                        }
                        to {
                            transform: translateX(-50%);
                        }
                    }
                `}</style>
      </div>
    </section>
  )
}
