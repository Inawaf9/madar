package com.example.madar.Repository;

import com.example.madar.Model.MovingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovingTaskRepository extends JpaRepository<MovingTask, Integer> {

    List<MovingTask> findMovingTasksByUser_IdOrderBySortOrder(Integer userId);

    MovingTask findMovingTaskByIdAndUser_Id(Integer id, Integer userId);

    boolean existsByUser_Id(Integer userId);
}