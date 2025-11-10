import { nikkaTextModule } from "./core/textModule";
(async () => {
    const res = await nikkaTextModule("hello", "234")
    console.log(res)
})()