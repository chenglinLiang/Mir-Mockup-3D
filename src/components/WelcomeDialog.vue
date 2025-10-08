<template>
  <div v-if="model">
    <div class="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="card bg-base-100 rounded-lg shadow-lg p-6 max-w-[700px] w-full">
        <h2 class="text-2xl font-bold mb-4">Bienvenue !</h2>
        <p class="mb-4">
          Merci d'utiliser notre application. Voici quelques conseils pour bien commencer :
        </p>
        <ul class="text-left mb-4 list-disc list-inside">
          <li>Utilisez les paramètres de caméra pour ajuster la vue.</li>
          <li>Configurez l'éclairage pour mettre en valeur votre modèle.</li>
          <li>Personnalisez l'arrière-plan avec une couleur ou une image.</li>
          <li>Utilisez les options de recadrage pour obtenir le rendu souhaité.</li>
          <li>Utiliser un ordinateur, le site n’a pas été prévu pour les petits écrans</li>
        </ul>
        <div class="divider"></div>

        <div class="alert alert-info mb-2">
          <p>Certaines options comme le <strong>crop</strong> sont assujetties à des erreurs</p>
        </div>
        <div class="alert alert-info mb-2">
          <p>Vous ne pouvez qu'ouvrir que 2 panels à la fois</p>
        </div>
        <div class="alert alert-info">
          <p>Actuellement un seul modèle est disponible: <strong>iPhone</strong></p>
        </div>
        <div class="divider"></div>

        <div class="text-sm text-gray-500">
          <a href="https://github.com/juliendu11/mir-mockup-3d" class="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              class="inline-block align-middle size-5"
            >
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
            <p>Projet open source avec rendu côté client uniquement</p>
          </a>
        </div>
        <button @click="model = false" class="mt-8 btn btn-primary">Commencer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const model = defineModel({
  type: Boolean,
  required: true,
})
</script>
