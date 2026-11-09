import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createVueDesign } from "@x-ac/design-vue";
import "@x-ac/design-vue/style.css";
import { elementPlusAdapter } from "@x-ac/design-vue-element-plus";
import "./styles.css";
import App from "./App.vue";

const app = createApp(App);
app.use(ElementPlus);
// 全局注入 Element Plus 适配包：宿主应用只需这一行即可接入 Schema 渲染与数据绑定。
app.use(createVueDesign({ adapter: elementPlusAdapter }));
app.mount("#app");
