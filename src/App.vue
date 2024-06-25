<script setup>
import { ref } from 'vue'
const contador =ref(0);

const incremento = ()=>{
  contador.value++;
}
const Decremento = ()=>{
  contador.value--;
}
</script>

<template>

  <div>
  
    <button @click="incremento" type="button" class="btn btn-success"><i class="bi bi-arrow-up"></i>UP</button>
    <span> {{ contador }}</span>
    <button @click="Decremento" type="button" class="btn btn-danger"><i class="bi bi-arrow-down"></i>Down</button>

  </div> 

</template>

<style scoped>

</style>
