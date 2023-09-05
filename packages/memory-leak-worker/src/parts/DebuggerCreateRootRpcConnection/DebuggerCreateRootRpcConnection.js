export const create = (rpc) => {
  return {
    invoke(method, params) {
      rpc.invoke({})
    },
  }
}
