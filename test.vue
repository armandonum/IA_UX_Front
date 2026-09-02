<template>

 <!-- Timeline -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2 text-dark">Línea de tiempo</div>
            <div class="col" />
            <div class="row q-gutter-x-sm text-caption text-grey-6">
              <span><span class="inline-block" style="width:10px;height:10px;border-radius:50%;background:#3B82F6;vertical-align:middle;margin-right:4px;"></span>Eventos</span>
              <span><span class="inline-block" style="width:10px;height:10px;border-radius:50%;background:#F59E0B;vertical-align:middle;margin-right:4px;"></span>Emociones</span>
              <span><span class="inline-block" style="width:10px;height:10px;border-radius:2px;background:#10B981;vertical-align:middle;margin-right:4px;"></span>Comentarios</span>
            </div>
          </div>

          <div
            ref="timelineBarEl"
            class="relative bg-grey-3 rounded cursor-pointer select-none"
            style="height:32px;"
            @click="onTimelineClick"
            @mousemove="onTimelineHover"
            @mouseleave="hoverMs = null"
          >
            <div
              class="absolute inset-y-0 left-0 bg-primary/20 rounded"
              :style="{ width: progresoPct + '%' }"
            />
            <div
              class="absolute inset-y-0 bg-primary"
              style="width:2px;"
              :style="{ left: progresoPct + '%' }"
            />

            <!-- Eventos -->
            <div
              v-for="ev in events"
              :key="'ev-' + ev.event_id"
              class="absolute top-1 rounded-full cursor-pointer hover:scale-150 transition-transform"
              style="width:6px;height:6px;background:#3B82F6;"
              :style="{ left: pct(ev.elapsed_ms_total) + '%' }"
              :title="`${formatTiempoS(ev.elapsed_ms_total)} · ${ev.event_type}`"
              @click.stop="seekAbsoluto(ev.elapsed_ms_total)"
            />

            <!-- Emociones -->
            <div
              v-for="(em, i) in emotionReadings"
              :key="'em-' + i"
              class="absolute bottom-1 rounded-full cursor-pointer hover:scale-150 transition-transform"
              style="width:6px;height:6px;background:#F59E0B;"
              :style="{ left: pct(getEmotionMs(em)) + '%' }"
              :title="`${formatTiempoS(getEmotionMs(em))} · ${getEmotionLabel(em)}`"
            />

            <!-- Comentarios -->
            <div
              v-for="c in comments"
              :key="'c-' + c.commentId"
              class="absolute top-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform"
              style="width:8px;height:8px;background:#10B981;transform:rotate(45deg);"
              :style="{ left: pct(c.elapsedMsTotal) + '%' }"
              :title="`${formatTiempoS(c.elapsedMsTotal)} · ${c.text}`"
              @click.stop="seekAbsoluto(c.elapsedMsTotal)"
            />

            <div
              v-if="hoverMs !== null"
              class="absolute -top-6 -translate-x-1/2 bg-primary text-white text-caption rounded px-1"
              style="font-size:10px;line-height:18px;"
              :style="{ left: pct(hoverMs) + '%' }"
              @click.stop="abrirModalComentario(hoverMs)"
            >
              + {{ formatTiempoS(hoverMs) }}
            </div>
          </div>
        </q-card-section>
      </q-card>

</template>