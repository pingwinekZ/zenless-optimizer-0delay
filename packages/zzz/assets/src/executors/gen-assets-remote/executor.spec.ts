import executor from './executor'

describe.skip('GenAssetsRemote Executor', () => {
  it('can run', async () => {
    const output = await executor({})
    expect(output.success).toBe(true)
  })
})
