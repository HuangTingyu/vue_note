<template>
  <div id="app">
    <p>
      <router-link to='/bar' class="app-link">Bar</router-link>
    </p>
    <router-view></router-view>
  </div>
  
</template>

<script>

export default {
  name: 'App',
  components: {
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.app-link{ 
  display: block;
  color: red;
}
</style>
