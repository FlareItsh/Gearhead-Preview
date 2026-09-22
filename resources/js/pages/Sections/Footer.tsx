import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react'

const socialLinks = [
  { href: 'https://www.facebook.com/GearheadCarwash', icon: Facebook },
  { href: 'https://instagram.com', icon: Instagram },
  { href: 'https://twitter.com', icon: Twitter },
]

const links = {
  'Useful Links': ['Home', 'About', 'Services', 'Testimonials'],
  Help: ['Customer Support', 'Terms & Conditions', 'Privacy Policy'],
}

export default function Footer() {
  return (
    <footer
      id="contact"
      className="w-full bg-black text-white"
    >
      {/* Get started banner */}
      <div className="mx-auto w-full max-w-6xl pt-5">
        <div className="grid overflow-hidden rounded-2xl md:grid-cols-2">
          {/* Image side */}
          <div className="relative h-96">
            <img
              src="/footer-Img.png"
              alt="Gearhead Carwash"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute top-1/2 left-8 z-10 max-w-md -translate-y-1/2">
              <h2 className="text-4xl font-bold text-white md:text-5xl">Ready to Get Started?</h2>

              <p className="mt-4 text-lg text-gray-200 md:text-xl">
                Join hundreds of satisfied customers and experience the Gearhead difference.
              </p>

              <a
                href="/services"
                className="mt-6 inline-flex items-center font-semibold text-highlight hover:underline"
              >
                Book your first wash
                <ArrowRight className="ml-2 h-5 w-5 -rotate-45" />
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="relative h-96 bg-muted">
            <iframe
              title="Gearhead Carwash Location"
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3586.318581890958!2d125.64508464235253!3d7.114144861233601!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96dd6cb4a3b9b%3A0x8550503b5de971e9!2sGear%20Head%20Carwash!5e0!3m2!1sen!2sus!4v1770280274698!5m2!1sen!2sus"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* Footer content */}
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 sm:gap-12 md:grid-cols-4">
        {/* About */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-highlight">About Us</h3>

          <p className="text-sm text-gray-300">
            Premium car wash services with cutting-edge technology and expert care.
          </p>

          <div className="mt-2 flex space-x-4">
            {socialLinks.map(({ href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-8 w-8 items-center justify-center rounded-full border-2 border-highlight transition-all duration-300 hover:scale-110 hover:bg-highlight"
              >
                <Icon
                  size={16}
                  className="text-highlight group-hover:text-black"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {Object.entries(links).map(([title, items]) => (
          <div
            key={title}
            className="space-y-3"
          >
            <h3 className="text-xl font-semibold text-highlight">{title}</h3>

            <ul className="space-y-2 text-sm text-gray-300">
              {items.map((item) => (
                <li
                  key={item}
                  className="cursor-pointer transition-colors duration-300 hover:text-highlight"
                >
                  <a
                    href={
                      item === 'Home'
                        ? '#hero'
                        : item === 'About'
                          ? '#about'
                          : item === 'Services'
                            ? '#services'
                            : item === 'Testimonials'
                              ? '#review'
                              : '#'
                    }
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-highlight">Connect With Us</h3>

          <div className="flex items-start space-x-3 sm:items-center">
            <MapPin className="mt-1 h-6 w-6 flex-shrink-0 text-highlight sm:mt-0" />
            <p className="text-sm break-words text-gray-300">
              Belen Road, Vicente Hizon, Lanang, Davao City, Philippines
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-highlight" />
            <p className="text-sm text-gray-300">+63 945 705 8829</p>
          </div>

          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-highlight" />
            <p className="text-sm text-gray-300">mssjambongana@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Rights */}
      <div className="mx-auto flex max-w-6xl justify-center border-t border-gray-700 px-6 py-4 text-sm text-gray-400">
        © 2026 All Rights Reserved.
      </div>
    </footer>
  )
}
