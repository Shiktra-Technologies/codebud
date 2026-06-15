"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Lesson, LessonBlock } from "@/lib/services/learningStudioService";
import type { CurriculumAction } from "./curriculumStore";
import InnerBlockPicker from "./InnerBlockPicker";
import { BlockRenderer } from "./BlockRenderers";

interface Props {
    lesson: Lesson;
    moduleId: string;
    dispatch: React.Dispatch<CurriculumAction>;
}

export default function LessonEditor({ lesson, moduleId, dispatch }: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = lesson.blocks.findIndex((b) => b.id === active.id);
            const newIndex = lesson.blocks.findIndex((b) => b.id === over.id);
            
            if (oldIndex >= 0 && newIndex >= 0) {
                const ids = lesson.blocks.map(b => b.id);
                const reordered = arrayMove(ids, oldIndex, newIndex);
                dispatch({
                    type: "reorder_lesson_blocks",
                    moduleId,
                    lessonId: lesson.id,
                    orderedIds: reordered,
                });
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-surface-0 overflow-y-auto custom-scrollbar relative border-l border-r border-white/[0.04]">
            {/* Elegant Top Header */}
            <div className="sticky top-0 z-20 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04] px-12 py-6">
                <input
                    type="text"
                    className="w-full bg-transparent text-4xl font-bold text-white/90 placeholder:text-white/20 outline-none"
                    value={lesson.title}
                    onChange={(e) =>
                        dispatch({
                            type: "update_lesson",
                            moduleId,
                            lessonId: lesson.id,
                            patch: { title: e.target.value },
                        })
                    }
                    placeholder="Lesson Title"
                />
            </div>

            <div className="flex-1 max-w-3xl w-full mx-auto px-12 py-10 pb-40">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={lesson.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                            {lesson.blocks.length === 0 ? (
                                <div className="py-12 flex justify-center">
                                    <InnerBlockPicker
                                        onPick={(type) =>
                                            dispatch({
                                                type: "add_lesson_block",
                                                moduleId,
                                                lessonId: lesson.id,
                                                blockType: type,
                                            })
                                        }
                                    />
                                </div>
                            ) : (
                                lesson.blocks.map((block) => (
                                    <SortableBlockItem
                                        key={block.id}
                                        block={block}
                                        moduleId={moduleId}
                                        lessonId={lesson.id}
                                        dispatch={dispatch}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </DndContext>

                {lesson.blocks.length > 0 && (
                    <div className="mt-4 flex justify-center">
                        <InnerBlockPicker
                            onPick={(type) =>
                                dispatch({
                                    type: "add_lesson_block",
                                    moduleId,
                                    lessonId: lesson.id,
                                    blockType: type,
                                })
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function SortableBlockItem({ block, moduleId, lessonId, dispatch }: { block: LessonBlock; moduleId: string; lessonId: string; dispatch: React.Dispatch<CurriculumAction> }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <InnerBlockPicker
                compact
                onPick={(type) =>
                    dispatch({
                        type: "add_lesson_block",
                        moduleId,
                        lessonId,
                        blockType: type,
                        afterBlockId: block.id,
                    })
                }
            />
            <BlockRenderer
                block={block}
                dragHandleProps={{ ...attributes, ...listeners }}
                onChange={(patch) =>
                    dispatch({
                        type: "update_lesson_block",
                        moduleId,
                        lessonId,
                        blockId: block.id,
                        patch,
                    })
                }
                onDelete={() =>
                    dispatch({
                        type: "remove_lesson_block",
                        moduleId,
                        lessonId,
                        blockId: block.id,
                    })
                }
            />
        </div>
    );
}
