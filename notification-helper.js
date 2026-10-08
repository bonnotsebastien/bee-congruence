// ════════════════════════════════════════════════════════
//  BEE Congruence — Web Push & Browser Notification Engine
//  Gère les rappels d'entraînement actifs paramétrés dans profil.html
// ════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const REMINDERS_KEY = 'bee_user_reminders';
  const LAST_NOTIFICATION_KEY = 'bee_last_web_notification_ts';

  const BeeNotifications = {
    /**
     * Vérifie si le navigateur supporte les notifications
     */
    isSupported: function() {
      return ('Notification' in window);
    },

    /**
     * Retourne la permission actuelle : 'granted', 'denied', 'default', ou 'unsupported'
     */
    getPermission: function() {
      if (!this.isSupported()) return 'unsupported';
      return Notification.permission;
    },

    /**
     * Demande la permission d'afficher des notifications
     */
    requestPermission: async function() {
      if (!this.isSupported()) {
        return 'unsupported';
      }
      try {
        const result = await Notification.requestPermission();
        this.updateUiBadges();
        return result;
      } catch (err) {
        console.warn('Erreur lors de la demande de permission de notification:', err);
        return Notification.permission;
      }
    },

    /**
     * Envoie une notification web immédiate (test ou rappel)
     */
    sendNotification: function(title, options = {}) {
      if (!this.isSupported() || Notification.permission !== 'granted') {
        return false;
      }

      const defaultOptions = {
        icon: 'logo.jpg',
        badge: 'logo.jpg',
        tag: 'bee-congruence-reminder',
        renotify: true,
        body: 'Prenez 5 minutes pour votre pause réflexive : « Réagir est automatique, répondre est un choix. »',
        data: { url: 'dashboard.html' }
      };

      const finalOptions = { ...defaultOptions, ...options };

      try {
        const notif = new Notification(title || '🐝 BEE Congruence — Entraînement du jour', finalOptions);

        notif.onclick = function(event) {
          event.preventDefault();
          window.focus();
          const targetUrl = (finalOptions.data && finalOptions.data.url) ? finalOptions.data.url : 'dashboard.html';
          window.location.href = targetUrl;
          notif.close();
        };

        // Enregistrer l'horodatage de la dernière notification
        localStorage.setItem(LAST_NOTIFICATION_KEY, Date.now().toString());
        return true;
      } catch (e) {
        console.warn('Impossible de créer la notification:', e);
        return false;
      }
    },

    /**
     * Déclenche une notification de test instantanée
     */
    sendTestNotification: async function() {
      if (!this.isSupported()) {
        if (typeof showToast === 'function') {
          showToast('⚠️ Votre navigateur ne supporte pas les notifications Web.', 'warning');
        } else {
          alert('Votre navigateur ne supporte pas les notifications Web.');
        }
        return false;
      }

      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await this.requestPermission();
      }

      if (perm === 'granted') {
        const success = this.sendNotification('🐝 BEE Congruence — Test réussi !', {
          body: 'Vos notifications de rappel sont bien actives. Vous recevrez votre déclic réflexif aux heures choisies.',
          tag: 'bee-test-notification'
        });

        if (success && typeof showToast === 'function') {
          showToast('🔔 Notification de test envoyée avec succès !', 'success');
        }
        return success;
      } else if (perm === 'denied') {
        if (typeof showToast === 'function') {
          showToast('⚠️ Les notifications sont bloquées dans les paramètres de votre navigateur.', 'warning');
        } else {
          alert('Les notifications sont bloquées dans les paramètres de votre navigateur.');
        }
        return false;
      }
      return false;
    },

    /**
     * Vérifie si un rappel d'entraînement programmé doit être déclenché
     */
    checkScheduledReminder: function() {
      if (!this.isSupported() || Notification.permission !== 'granted') {
        return;
      }

      // Récupérer les préférences de l'utilisateur
      let prefs = {};
      try {
        const local = localStorage.getItem(REMINDERS_KEY);
        if (local) prefs = JSON.parse(local);
      } catch (e) {}

      const channel = prefs.channel || prefs.channels || 'both';
      if (channel !== 'both' && channel !== 'mobile' && channel !== 'web') {
        // L'utilisateur a choisi email uniquement
        return;
      }

      const frequency = prefs.frequency || 'daily'; // daily, every_2_days, weekly, custom
      const preferredTime = prefs.preferred_time || '08:30'; // format "HH:MM"
      const [targetH, targetM] = preferredTime.split(':').map(n => parseInt(n, 10) || 0);

      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      // Vérifier si l'heure actuelle est passée par rapport à l'heure préférée
      const isPastTargetTime = (currentH > targetH) || (currentH === targetH && currentM >= targetM);

      const lastTs = parseInt(localStorage.getItem(LAST_NOTIFICATION_KEY) || '0', 10);
      const lastDate = new Date(lastTs);
      const isSameDay = (lastDate.getFullYear() === now.getFullYear() &&
                         lastDate.getMonth() === now.getMonth() &&
                         lastDate.getDate() === now.getDate());

      const msInDay = 86400000;
      const daysSinceLast = lastTs ? ((now.getTime() - lastTs) / msInDay) : 999;

      let shouldTrigger = false;

      if (frequency === 'daily') {
        if (!isSameDay && isPastTargetTime) {
          shouldTrigger = true;
        }
      } else if (frequency === 'every_2_days') {
        if (daysSinceLast >= 2 && isPastTargetTime) {
          shouldTrigger = true;
        }
      } else if (frequency === 'weekly') {
        if (daysSinceLast >= 7 && isPastTargetTime) {
          shouldTrigger = true;
        }
      } else if (frequency === 'custom') {
        if (!isSameDay && isPastTargetTime) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        const phrases = [
          'Prenez 5 minutes pour votre entraînement de congruence : « Réagir est automatique, répondre est un choix. »',
          'Un nouveau scénario est prêt pour affiner vos réflexes relationnels.',
          'Votre rituel du jour : observez votre montée émotionnelle et choisissez la pause.',
          'Affirmez vos limites avec calme et clarté : pratiquez votre scénario du jour.'
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

        this.sendNotification('🐝 BEE Congruence — Votre rituel du jour', {
          body: randomPhrase,
          tag: 'bee-scheduled-reminder',
          data: { url: 'dashboard.html' }
        });
      }
    },

    /**
     * Met à jour les éléments visuels de statut dans la page profil
     */
    updateUiBadges: function() {
      const statusEl = document.getElementById('webNotificationStatusBadge');
      if (!statusEl) return;

      const perm = this.getPermission();
      if (perm === 'granted') {
        statusEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.12);color:#059669;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;">🟢 Notifications Web actives</span>';
      } else if (perm === 'denied') {
        statusEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.12);color:#DC2626;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;">🔴 Notifications bloquées par le navigateur</span>';
      } else {
        statusEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,0.12);color:#D97706;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;">🔔 Notifications en attente d\'activation</span>';
      }
    },

    /**
     * Initialisation automatique et surveillance
     */
    init: function() {
      this.updateUiBadges();
      // Vérification immédiate
      this.checkScheduledReminder();

      // Vérification toutes les 60 secondes en arrière-plan
      if (!window._beeNotifInterval) {
        window._beeNotifInterval = setInterval(() => {
          this.checkScheduledReminder();
        }, 60000);
      }

      // Vérification quand l'utilisateur revient sur la page / l'onglet
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkScheduledReminder();
          this.updateUiBadges();
        }
      });
    }
  };

  window.BeeNotifications = BeeNotifications;

  // Initialiser dès que le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BeeNotifications.init());
  } else {
    BeeNotifications.init();
  }

})(window);
