import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

let authListenerInitialized = false

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
  }),

  actions: {
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      this.user = data.user
      this.session = data.session
      this.isAuthenticated = true

      this.fetchProfile()
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.session = null
      this.profile = null
      this.isAuthenticated = false
    },

    async fetchUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      this.session = session
      this.user = session?.user ?? null
      this.isAuthenticated = !!session

      if (this.user) {
        await this.fetchProfile()
      } else {
        this.profile = null
      }
    },

    setupAuthListener() {
      if (authListenerInitialized) {
        return
      }

      authListenerInitialized = true

      supabase.auth.onAuthStateChange(async (_event, session) => {
        this.session = session
        this.user = session?.user ?? null
        this.isAuthenticated = !!session

        if (this.user) {
          this.fetchProfile()
        } else {
          this.profile = null
        }
      })
    },

    async fetchProfile() {
      if (!this.user) {
        return
      }

      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', this.user.id)
        .single()

      if (error) {
        this.profile = null
        return
      }

      this.profile = data
    },
  },
})