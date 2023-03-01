<script lang="ts">
import { ref, defineComponent } from 'vue';
import { Transaction } from '@solana/web3.js';
import { Button, Layout } from '@/components';
import { 
  Timelock, 
  Tray, 
  chunk, 
  getHumanTimeRemaining, 
  getProvider,
  shortenSignature, 
  signCreateAtaTx, 
  signUnlockTx, 
  signWithdrawTx, 
} from '@/types';

const BufferPeriod = 60 * 60 * 1000; // 1 hour
const MaxUnlockInstructionsPerTx = 4;
const MaxWithdrawInstructionsPerTx = 3;

enum StepAction {
  CreateAta,
  Unlock,
  Withdraw,
  WaitPeriod,
  Completed
}

interface Step {
  action: StepAction;
  context: { [key: string]: any }
  batch?: number;
}

export default defineComponent({
  components: {
    Button,
    Layout,
  },

  props: {
    found: {
      required: true
    },
    tray: {
      type: Tray,
      required: true
    }
  },

  setup(props) {
    const tray = props.tray;
    const accounts = props.found as Timelock[];

    const allUnlockedBy = accounts.filter((a) => a.isLocked()).reduce((acc, cur) => {
      return acc > cur.getUnlockAtTime() ? acc : cur.getUnlockAtTime();
    }, 0);

    const locked = chunk(accounts.filter((a) => a.isLocked()), MaxUnlockInstructionsPerTx);
    const waiting = chunk(accounts.filter((a) => a.canDeactivateLock()), MaxWithdrawInstructionsPerTx);

    console.log('locked', locked)
    console.log('waiting', waiting)

    const steps: Step[] = [

      ...waiting.map((a, n) => ({
        action: StepAction.Withdraw,
        context: { accounts: a, },
        batch: n + 1
      })),

      ...locked.map((a, n) => ({
        action: StepAction.Unlock,
        context: { accounts: a, },
        batch: n + 1
      })),

    ];

    if (waiting.length > 0) {
      steps.unshift({
        action: StepAction.CreateAta,
        context: { tray, },
      })
    }

    if (locked.length > 0) {
      steps.push({
        action: StepAction.WaitPeriod,
        context: { allUnlockedBy }
      })
    } else {
      steps.push({
        action: StepAction.Completed,
        context: {}
      })
    }

    return {
      StepAction,
      SafetyPeriod: BufferPeriod,

      steps,
      locked,
      waiting,
      accounts: props.found as Timelock[],
      currentStep: ref(0),
      allUnlockedBy,
      sigs: ref([] as string[]),
    };
  },

  methods: {
    getHumanTimeRemaining,
    shorten(sig: string) : string { 
      return shortenSignature(sig);
    },

    getCurrentStep() {
      return this.steps[this.currentStep];
    },

    onBack() {
      this.$bus.emit('goto:feepage');
    },

    onDone() {
      this.$bus.emit('goto:accountlist');
    },

    async onNext() {
      const step = this.getCurrentStep();

      try {

        let signed: Transaction;
        if (step.action === StepAction.CreateAta) {
          signed = await signCreateAtaTx(step.context.tray);
        } else if (step.action === StepAction.Unlock) {
          signed = await signUnlockTx(step.context.accounts);
        } else if (step.action === StepAction.Withdraw) {
          signed = await signWithdrawTx(this.tray, step.context.accounts);
        } else {
          throw new Error('Unknown step action');
        }

        const { connection } = getProvider();
        const rawTransaction = signed.serialize();
        const sig = await connection().sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          preflightCommitment: 'confirmed',
        });

        console.log('Transaction sent', sig);

        this.sigs.push(sig);
        if (this.currentStep < this.steps.length - 1) {
          this.currentStep++;
        }
      } catch (err: any) {
        console.error(err);
        console.log('Transaction send failed');
      }
    },
  },
});
</script>

<template>
  <Layout :header="true">
    <div class="grid h-screen place-items-center mt-0 sm:mt-[-5rem]">
      <div class="max-w-2xl">

        <p class="font-display text-4xl tracking-tight text-white">
          Unlocking Your Accounts
        </p>

        <div v-if="getCurrentStep().action != StepAction.WaitPeriod">
          <p class="mt-5 mb-2 text-xl text-slate-400">
            Please sign the transactions that will be sent to your fee wallet.
            <span v-if="allUnlockedBy > Date.now()">Note, you will need to wait {{ getHumanTimeRemaining(allUnlockedBy +
            SafetyPeriod) }} to complete this process.</span>
          </p>
        </div>
        <div v-else>
          <p class="mt-5 mb-2 text-xl text-slate-400">
            Please return in <span class="text-white">{{
              getHumanTimeRemaining(allUnlockedBy, { days: true, hours: true,
                minutes: true })
            }}</span> to complete the unlock process and withdraw your Kin.
          </p>

          <div v-if="sigs.length > 0">
            <p class="mt-5 mb-2 text-xl text-white">
              Sent transactions
            </p>
            <ul role="list" class="space-y-9">
              <li>
                <ul role="list" class="mt-2 space-y-2 border-l-2 border-slate-100 dark:border-slate-800">
                  <li class="relative" v-for="sig in sigs" :key="sig">
                    <a target="_blank" :href="`http://explorer.solana.com/tx/${sig}`"
                      class="block w-full pl-3.5 before:pointer-events-none
                      before:absolute before:-left-1 before:top-1/2 before:h-1.5
                      before:w-1.5 before:-translate-y-1/2 before:rounded-full
                      text-slate-500 before:hidden before:bg-slate-300
                      hover:text-slate-600 hover:before:block dark:text-slate-400
                      dark:before:bg-slate-700 dark:hover:text-slate-300"
                      >{{ shorten(sig) }}</a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-20">
          <h4 class="sr-only">Status</h4>
          <p class="text-sm font-medium text-white hidden"></p>

          <div class="mt-6" aria-hidden="true">
            <div class="overflow-hidden rounded-full bg-gray-700">
              <div class="h-2 rounded-full bg-slate-400 transition-all ease-in duration-1000"
                :style="`width: ${currentStep == steps.length - 1 ? 100 : Math.max(10 + currentStep * (100 / steps.length))}%`">
              </div>
            </div>

            <div class="mt-6 hidden text-sm font-medium text-gray-600 sm:grid" :class="`grid-cols-${steps.length}`">
              <div v-for="(step, index) in steps" :key="index" :class="{
                'text-white': index <= currentStep,
                'text-slate-600': index > currentStep,
                'text-center px-5': index > 0 && index < steps.length - 1,
                'text-right': index == steps.length - 1 }"
                class=""
              >
                <span v-if="step.action == StepAction.CreateAta">Create Token Account</span>
                <span v-if="steps.length <= 3">
                  <span v-if="step.action == StepAction.Unlock">Revoke Timelock</span>
                  <span v-if="step.action == StepAction.Withdraw">Finalize Unlock</span>
                </span>
                <span v-else>
                  <span v-if="step.action == StepAction.Unlock">Revoke Batch {{ step.batch }}</span>
                  <span v-if="step.action == StepAction.Withdraw">Finalize Batch {{ step.batch }}</span>
                </span>
                <span v-if="step.action == StepAction.WaitPeriod">Wait Period</span>
                <span v-if="step.action == StepAction.Completed">Completed</span>
              </div>

            </div>
          </div>
        </div>

        <div class="mt-10 flex gap-4 justify-end" v-if="currentStep < steps.length - 1">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="primary" @click="onNext()">Submit Transaction</Button>
        </div>
        <div class="mt-10 flex gap-4 justify-end" v-else>
          <Button variant="secondary" @click="onDone()">Done</Button>
        </div>
      </div>
    </div>
  </Layout>
</template>
