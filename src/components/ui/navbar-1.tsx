"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X, Droplets, LogIn, UserPlus } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { Button } from "@/components/ui/button"

interface Navbar1Props {
  profileId?: string
}

const Navbar1 = ({ profileId }: Navbar1Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const toggleMenu = () => setIsOpen(!isOpen)

  const navItems = user 
    ? [
        { label: "Home", href: "/" },
        { label: "How It Works", href: "/about" },
        { label: "Dashboard", href: "/dashboard" },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "How It Works", href: "/about" },
      ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-white/10" />
      
      <div className="container relative px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Droplets className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-foreground">BloodX</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <motion.div
                  className="relative px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-white/5 opacity-0 hover:opacity-100 transition-opacity"
                  />
                  <span className="relative z-10 text-sm font-medium">
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Desktop CTA / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {profileId && (
                  <NotificationBell
                    profileId={profileId}
                    soundEnabled={soundEnabled}
                    onToggleSound={() => setSoundEnabled(!soundEnabled)}
                  />
                )}
                <motion.button
                  onClick={signOut}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-white/10 bg-white/5 backdrop-blur-sm transition-colors"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign Out
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </span>
                </motion.button>
                <motion.button
                  onClick={() => navigate("/register")}
                  className="relative px-5 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl" />
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl shadow-lg shadow-red-500/25 group-hover:shadow-red-500/40 transition-shadow" />
                  <span className="relative z-10 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Register
                  </span>
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {user && profileId && (
              <NotificationBell
                profileId={profileId}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
              />
            )}
            <motion.button
              onClick={toggleMenu}
              className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
              onClick={toggleMenu}
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative pt-24 px-6 pb-8"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      onClick={toggleMenu}
                      className="block px-4 py-3 rounded-xl text-lg font-medium text-foreground hover:bg-white/5 transition-colors border border-white/5"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + navItems.length * 0.05 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  {user ? (
                    <button
                      onClick={() => { signOut(); toggleMenu(); }}
                      className="w-full px-4 py-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-foreground border border-white/10 bg-white/5 transition-colors"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => { navigate("/login"); toggleMenu(); }}
                        className="w-full px-4 py-3 rounded-xl text-lg font-medium text-foreground hover:bg-white/5 transition-colors border border-white/10"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <LogIn className="w-5 h-5" />
                          Sign In
                        </span>
                      </button>
                      <button
                        onClick={() => { navigate("/register"); toggleMenu(); }}
                        className="w-full px-4 py-3 rounded-xl text-lg font-medium text-white bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <UserPlus className="w-5 h-5" />
                          Register
                        </span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export { Navbar1 }
